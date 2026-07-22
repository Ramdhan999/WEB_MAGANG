package services

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	_ "image/jpeg" // register decoder JPEG
	_ "image/png"  // register decoder PNG
	"log"
	"os"
	"slices"
)

// =====================================================================
// Bikin GIF animasi dari foto-foto Live Preview di /result.
//
// Hasilnya di-upload ke subfolder Drive "Hasil live preview" (lihat
// gdrive.go), jadi user dapet versi gerak dari slideshow yang tadi
// ditonton di layar booth.
//
// Sengaja cuma pakai stdlib (image/gif) biar nggak nambah dependency.
// Dua hal yang nentuin ketajaman hasilnya:
//
//  1. UKURAN KANVAS — ngikutin foto sumber, dibatasi gifMaxCanvasW.
//     GIF nggak pernah di-upscale: nge-gedein 640px jadi 1080px cuma
//     bikin file bengkak tanpa nambah detail.
//
//  2. PALET — GIF cuma sanggup 256 warna per frame. Palet tetap kayak
//     palette.Plan9 itu grid RGB seragam, jadi warna kulit & gradasi
//     langit keliatan belang/kotor. Di sini paletnya dihitung ulang per
//     frame (median cut) dari warna yang bener-bener ada di foto itu.
//
// Semua frame di-render ke kanvas ukuran sama (center-crop "cover") —
// persis kayak object-cover di frontend — karena GIF butuh tiap frame
// konsisten.
// =====================================================================

const (
	// Batas atas lebar kanvas GIF. Dinaikin bikin makin tajem tapi filenya
	// ikut gede (kira-kira linier sama jumlah piksel × jumlah frame).
	gifMaxCanvasW = 960

	// Rasio kanvas 3:2, ngikutin CAPTURE_ASPECT di frontend.
	gifAspectW = 3
	gifAspectH = 2

	gifPaletteSize = 256
	gifMinDelayCs  = 2   // 20 ms — batas bawah yang masih dihormatin browser
	gifMaxDelayCs  = 500 // 5 detik

	// Piksel yang disampling buat nyusun palet. Nggak perlu semua — 120rb
	// udah lebih dari cukup buat nentuin 256 warna, dan jauh lebih cepet.
	gifPaletteSamples = 120000
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

	cw, ch := gifCanvasSize(localPaths)
	if cw == 0 {
		return nil, fmt.Errorf("nggak ada foto yang bisa dibaca")
	}

	anim := &gif.GIF{LoopCount: 0} // 0 = loop selamanya
	var skipped int

	for _, p := range localPaths {
		frame, err := renderGIFFrame(p, cw, ch)
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

	log.Printf("🎞️  GIF live preview: %dx%d · %d frame · %d KB (skip %d)",
		cw, ch, len(anim.Image), buf.Len()/1024, skipped)
	return buf.Bytes(), nil
}

// gifCanvasSize nentuin ukuran kanvas: rasio 3:2, selebar mungkin tapi nggak
// ngelebihin foto paling kecil (biar nggak upscale) dan nggak lebih dari
// gifMaxCanvasW. Cuma baca header file (DecodeConfig), nggak decode penuh.
func gifCanvasSize(paths []string) (int, int) {
	minCropW := 0

	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		cfg, _, err := image.DecodeConfig(f)
		f.Close()
		if err != nil || cfg.Width <= 0 || cfg.Height <= 0 {
			continue
		}

		// Lebar efektif setelah center-crop ke 3:2.
		cropW := cfg.Width
		if cfg.Width*gifAspectH > cfg.Height*gifAspectW {
			cropW = cfg.Height * gifAspectW / gifAspectH // kelewat lebar → kepotong kiri-kanan
		}
		if minCropW == 0 || cropW < minCropW {
			minCropW = cropW
		}
	}

	if minCropW == 0 {
		return 0, 0
	}

	w := minCropW
	if w > gifMaxCanvasW {
		w = gifMaxCanvasW
	}
	h := w * gifAspectH / gifAspectW
	if h < 1 {
		h = 1
	}
	return w, h
}

// renderGIFFrame baca 1 file foto → center-crop "cover" → resize ke kanvas
// GIF → quantize ke palet adaptif pakai dithering Floyd-Steinberg.
func renderGIFFrame(path string, cw, ch int) (*image.Paletted, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		return nil, err
	}

	scaled := resizeCover(toRGBA(src), cw, ch)
	pal := medianCutPalette(scaled, gifPaletteSize)
	return ditherToPaletted(scaled, pal), nil
}

// ditherToPaletted petain tiap piksel ke warna palet terdekat pakai dithering
// Floyd-Steinberg (error-nya disebar ke tetangga, biar gradasi nggak jadi
// blok-blok kasar).
//
// Ditulis sendiri — bukan draw.FloydSteinberg dari stdlib — karena stdlib
// nyisir semua 256 warna palet buat TIAP piksel. Di sini hasil pencarian
// disimpen di cache per bucket warna 6-6-6 bit, jadi pencarian mahalnya paling
// banyak kejadian sekali per bucket, bukan sekali per piksel.
func ditherToPaletted(src *image.RGBA, pal color.Palette) *image.Paletted {
	b := src.Bounds()
	w, h := b.Dx(), b.Dy()
	dst := image.NewPaletted(image.Rect(0, 0, w, h), pal)

	// Palet dipecah jadi slice int32 biar nggak kena interface call per piksel.
	pr := make([]int32, len(pal))
	pg := make([]int32, len(pal))
	pb := make([]int32, len(pal))
	for i, c := range pal {
		rc := color.RGBAModel.Convert(c).(color.RGBA)
		pr[i], pg[i], pb[i] = int32(rc.R), int32(rc.G), int32(rc.B)
	}

	const cacheBits = 6
	const cacheShift = 8 - cacheBits
	cache := make([]int16, 1<<(cacheBits*3))
	for i := range cache {
		cache[i] = -1
	}

	// Buffer error 2 baris berjalan. Tiap piksel 3 kanal, plus 1 kolom padding
	// di kiri & kanan biar tetangga diagonal di pinggir nggak keluar slice.
	stride := (w + 2) * 3
	cur := make([]int32, stride)
	next := make([]int32, stride)

	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			o := src.PixOffset(x, y)
			e := (x + 1) * 3

			// Error dikumpulin udah dikali bobot, jadi dibagi 16 pas dibaca.
			r := clamp255(int32(src.Pix[o]) + cur[e]/16)
			g := clamp255(int32(src.Pix[o+1]) + cur[e+1]/16)
			bl := clamp255(int32(src.Pix[o+2]) + cur[e+2]/16)

			key := (r>>cacheShift)<<(cacheBits*2) | (g>>cacheShift)<<cacheBits | (bl >> cacheShift)
			idx := cache[key]
			if idx < 0 {
				best, bestDist := 0, int32(1<<30)
				for i := range pr {
					dr, dg, db := r-pr[i], g-pg[i], bl-pb[i]
					if d := dr*dr + dg*dg + db*db; d < bestDist {
						best, bestDist = i, d
					}
				}
				idx = int16(best)
				cache[key] = idx
			}
			dst.Pix[y*dst.Stride+x] = uint8(idx)

			er, eg, eb := r-pr[idx], g-pg[idx], bl-pb[idx]

			// Sebar error: 7/16 kanan, 3/16 kiri-bawah, 5/16 bawah, 1/16 kanan-bawah.
			cur[e+3] += er * 7
			cur[e+4] += eg * 7
			cur[e+5] += eb * 7

			next[e-3] += er * 3
			next[e-2] += eg * 3
			next[e-1] += eb * 3

			next[e] += er * 5
			next[e+1] += eg * 5
			next[e+2] += eb * 5

			next[e+3] += er
			next[e+4] += eg
			next[e+5] += eb
		}

		cur, next = next, cur
		for i := range next {
			next[i] = 0
		}
	}
	return dst
}

func clamp255(v int32) int32 {
	if v < 0 {
		return 0
	}
	if v > 255 {
		return 255
	}
	return v
}

// toRGBA konversi hasil decode ke *image.RGBA sekali di depan, dengan bounds
// dinormalin ke (0,0). Baca piksel lewat src.At() itu mahal banget buat JPEG
// (tiap panggilan konversi YCbCr → RGB lewat interface), padahal resize butuh
// baca TIAP piksel sumber. draw.Draw punya jalur cepat khusus konversi ini,
// jadi sisanya tinggal baca slice Pix langsung.
func toRGBA(src image.Image) *image.RGBA {
	if r, ok := src.(*image.RGBA); ok && r.Bounds().Min == (image.Point{}) {
		return r
	}
	b := src.Bounds()
	dst := image.NewRGBA(image.Rect(0, 0, b.Dx(), b.Dy()))
	draw.Draw(dst, dst.Bounds(), src, b.Min, draw.Src)
	return dst
}

// resizeCover crop tengah biar rasionya pas, terus downscale pakai rata-rata
// area (box filter) — jauh lebih halus dibanding nearest-neighbor buat foto
// kamera yang resolusinya gede.
func resizeCover(src *image.RGBA, dw, dh int) *image.RGBA {
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
				o := src.PixOffset(sx0, sy)
				for sx := sx0; sx < sx1; sx++ {
					sr += uint64(src.Pix[o])
					sg += uint64(src.Pix[o+1])
					sb += uint64(src.Pix[o+2])
					o += 4
					n++
				}
			}
			if n == 0 {
				n = 1
			}

			o := dst.PixOffset(x, y)
			dst.Pix[o] = uint8(sr / n)
			dst.Pix[o+1] = uint8(sg / n)
			dst.Pix[o+2] = uint8(sb / n)
			dst.Pix[o+3] = 255
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

// =====================================================================
// Median cut — palet adaptif per frame
// =====================================================================

type rgb8 struct{ r, g, b uint8 }

func (c rgb8) channel(a int) uint8 {
	switch a {
	case 0:
		return c.r
	case 1:
		return c.g
	}
	return c.b
}

// colorBox = sekumpulan warna + sumbu terlebarnya. Rentangnya dihitung SEKALI
// pas kotaknya dibikin: loop pemilihan di bawah jalan ratusan kali, kalau tiap
// putaran ngescan ulang isi semua kotak, biayanya jadi O(jumlah warna × 256).
type colorBox struct {
	px   []rgb8
	axis int // sumbu warna dengan rentang paling lebar (0=R, 1=G, 2=B)
	span int // lebar rentang di sumbu itu
}

func newColorBox(px []rgb8) colorBox {
	a, s := widestAxis(px)
	return colorBox{px: px, axis: a, span: s}
}

// medianCutPalette pilih maksimal `maxColors` warna yang paling mewakili
// gambar. Caranya: mulai dari satu kotak berisi semua warna, terus berkali-kali
// belah kotak yang rentang warnanya paling lebar tepat di nilai tengahnya,
// sampai jumlah kotak = maxColors. Tiap kotak jadi satu warna palet (rata-rata
// isinya).
func medianCutPalette(img *image.RGBA, maxColors int) color.Palette {
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	total := w * h
	if total <= 0 {
		return color.Palette{color.RGBA{A: 255}}
	}

	step := 1
	if total > gifPaletteSamples {
		step = total / gifPaletteSamples
	}

	px := make([]rgb8, 0, total/step+1)
	for i := 0; i < total; i += step {
		o := img.PixOffset(b.Min.X+i%w, b.Min.Y+i/w)
		px = append(px, rgb8{img.Pix[o], img.Pix[o+1], img.Pix[o+2]})
	}
	if len(px) == 0 {
		return color.Palette{color.RGBA{A: 255}}
	}

	boxes := []colorBox{newColorBox(px)}
	for len(boxes) < maxColors {
		// Belah kotak yang paling "lebar" — itu yang paling rugi kalau
		// diwakili satu warna doang.
		target, widest := -1, 0
		for i := range boxes {
			if len(boxes[i].px) >= 2 && boxes[i].span > widest {
				target, widest = i, boxes[i].span
			}
		}
		if target < 0 {
			break // semua kotak isinya warna seragam — nggak ada gunanya dibelah
		}

		// slices.SortFunc, bukan sort.Slice — sort.Slice nuker elemen lewat
		// refleksi, dan di sini sorting-nya jalan ratusan kali.
		box := boxes[target]
		slices.SortFunc(box.px, func(a, b rgb8) int {
			return int(a.channel(box.axis)) - int(b.channel(box.axis))
		})

		mid := len(box.px) / 2
		boxes[target] = newColorBox(box.px[:mid])
		boxes = append(boxes, newColorBox(box.px[mid:]))
	}

	pal := make(color.Palette, 0, len(boxes))
	for _, box := range boxes {
		pal = append(pal, averageRGB(box.px))
	}
	return pal
}

// widestAxis balikin sumbu warna (0=R, 1=G, 2=B) dengan rentang paling lebar.
func widestAxis(px []rgb8) (axis, span int) {
	lo := [3]uint8{255, 255, 255}
	hi := [3]uint8{0, 0, 0}
	for _, c := range px {
		for a := 0; a < 3; a++ {
			v := c.channel(a)
			if v < lo[a] {
				lo[a] = v
			}
			if v > hi[a] {
				hi[a] = v
			}
		}
	}
	for a := 0; a < 3; a++ {
		if s := int(hi[a]) - int(lo[a]); s > span {
			axis, span = a, s
		}
	}
	return axis, span
}

func averageRGB(px []rgb8) color.RGBA {
	if len(px) == 0 {
		return color.RGBA{A: 255}
	}
	var r, g, b uint64
	for _, c := range px {
		r += uint64(c.r)
		g += uint64(c.g)
		b += uint64(c.b)
	}
	n := uint64(len(px))
	return color.RGBA{R: uint8(r / n), G: uint8(g / n), B: uint8(b / n), A: 255}
}
