package services

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/color/palette"
	"image/draw"
	"image/gif"
	_ "image/jpeg" // register decoder JPEG
	_ "image/png"  // register decoder PNG
	"os"
)

// =====================================================================
// Bikin GIF animasi dari foto-foto Live Preview di /result.
//
// Hasilnya di-upload ke subfolder Drive "Hasil live preview" (lihat
// gdrive.go), jadi user dapet versi gerak dari slideshow yang tadi
// ditonton di layar booth.
//
// Sengaja cuma pakai stdlib (image/gif + palette Plan9 + Floyd-Steinberg)
// biar nggak nambah dependency. Semua frame di-render ke kanvas ukuran
// sama (center-crop "cover") — persis kayak object-cover di frontend —
// karena GIF butuh tiap frame konsisten.
// =====================================================================

const (
	// Ukuran kanvas GIF. 3:2 ngikutin CAPTURE_ASPECT di frontend.
	gifCanvasW = 480
	gifCanvasH = 320

	gifMinDelayCs = 2  // 20 ms — batas bawah yang masih dihormatin browser
	gifMaxDelayCs = 500 // 5 detik
)

// BuildLivePreviewGIF baca foto dari disk sesuai urutan `localPaths`, lalu
// encode jadi GIF animasi yang looping terus. `delayMs` = jeda antar frame
// (ngikutin kecepatan slideshow yang dipilih user).
//
// File yang gagal dibaca/decode di-skip aja — sisanya tetep jadi GIF. Error
// cuma dibalikin kalau nggak ada satu pun frame yang kepake.
func BuildLivePreviewGIF(localPaths []string, delayMs int) ([]byte, error) {
	if len(localPaths) == 0 {
		return nil, fmt.Errorf("nggak ada foto buat dijadiin GIF")
	}

	delayCs := delayMs / 10
	if delayCs < gifMinDelayCs {
		delayCs = gifMinDelayCs
	}
	if delayCs > gifMaxDelayCs {
		delayCs = gifMaxDelayCs
	}

	anim := &gif.GIF{LoopCount: 0} // 0 = loop selamanya
	var skipped int

	for _, p := range localPaths {
		frame, err := renderGIFFrame(p)
		if err != nil {
			skipped++
			continue
		}
		anim.Image = append(anim.Image, frame)
		anim.Delay = append(anim.Delay, delayCs)
	}

	if len(anim.Image) == 0 {
		return nil, fmt.Errorf("semua foto gagal dibaca (%d file)", skipped)
	}

	var buf bytes.Buffer
	if err := gif.EncodeAll(&buf, anim); err != nil {
		return nil, fmt.Errorf("encode GIF gagal: %w", err)
	}
	return buf.Bytes(), nil
}

// renderGIFFrame baca 1 file foto → center-crop "cover" → resize ke kanvas
// GIF → quantize ke palet 256 warna pakai dithering.
func renderGIFFrame(path string) (*image.Paletted, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		return nil, err
	}

	scaled := resizeCover(src, gifCanvasW, gifCanvasH)

	out := image.NewPaletted(image.Rect(0, 0, gifCanvasW, gifCanvasH), palette.Plan9)
	draw.FloydSteinberg.Draw(out, out.Bounds(), scaled, image.Point{})
	return out, nil
}

// resizeCover crop tengah biar aspect-nya pas, terus downscale pakai
// rata-rata area (box filter) — jauh lebih halus dibanding nearest-neighbor
// buat foto kamera yang resolusinya gede.
func resizeCover(src image.Image, dw, dh int) *image.RGBA {
	b := src.Bounds()
	crop := coverCropRect(b, dw, dh)
	cw, ch := crop.Dx(), crop.Dy()

	dst := image.NewRGBA(image.Rect(0, 0, dw, dh))
	for y := 0; y < dh; y++ {
		sy0 := crop.Min.Y + y*ch/dh
		sy1 := crop.Min.Y + (y+1)*ch/dh
		if sy1 <= sy0 {
			sy1 = sy0 + 1
		}
		for x := 0; x < dw; x++ {
			sx0 := crop.Min.X + x*cw/dw
			sx1 := crop.Min.X + (x+1)*cw/dw
			if sx1 <= sx0 {
				sx1 = sx0 + 1
			}

			var sr, sg, sb, n uint64
			for sy := sy0; sy < sy1; sy++ {
				for sx := sx0; sx < sx1; sx++ {
					r, g, bl, _ := src.At(sx, sy).RGBA()
					sr += uint64(r >> 8)
					sg += uint64(g >> 8)
					sb += uint64(bl >> 8)
					n++
				}
			}
			if n == 0 {
				n = 1
			}
			dst.SetRGBA(x, y, color.RGBA{
				R: uint8(sr / n),
				G: uint8(sg / n),
				B: uint8(sb / n),
				A: 255,
			})
		}
	}
	return dst
}

// coverCropRect hitung area tengah di `b` yang rasionya sama kayak dw:dh.
func coverCropRect(b image.Rectangle, dw, dh int) image.Rectangle {
	sw, sh := b.Dx(), b.Dy()
	if sw <= 0 || sh <= 0 {
		return b
	}

	srcAspect := float64(sw) / float64(sh)
	dstAspect := float64(dw) / float64(dh)

	cw, ch := sw, sh
	if srcAspect > dstAspect {
		cw = int(float64(sh) * dstAspect) // terlalu lebar → potong kiri-kanan
	} else if srcAspect < dstAspect {
		ch = int(float64(sw) / dstAspect) // terlalu tinggi → potong atas-bawah
	}
	if cw < 1 {
		cw = 1
	}
	if ch < 1 {
		ch = 1
	}

	x0 := b.Min.X + (sw-cw)/2
	y0 := b.Min.Y + (sh-ch)/2
	return image.Rect(x0, y0, x0+cw, y0+ch)
}
