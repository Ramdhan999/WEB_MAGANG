import Link from "next/link";

export default function TutorialAlurPage() {
  const steps = [
    { num: "1", title: "Pilih Paket", desc: "Pilih paket foto Glambot sesuai kebutuhan.", img: "/step1.png" },
    { num: "2", title: "Bayar &\nVerifikasi", desc: "Bayar via QRIS atau Kartu.", img: "/step2.png" },
    { num: "3", title: "Tutorial", desc: "Tutorial penggunaan Glambot arm robot.", img: "/step3.png" },
    { num: "4", title: "Foto", desc: "Sesi ambil foto sesuai keinginan dengan batas sesuai paket.", img: "/step4.png" },
    { num: "5", title: "Seleksi\nFoto", desc: "Pilih foto terbaikmu untuk di masukkan ke dalam frame cetak.", img: "/step5.png" },
    { num: "6", title: "Pilih\nFrame", desc: "Pilih frame cetak yang kamu inginkan.", img: "/step6.png" },
    { num: "7", title: "Filter &\nStiker", desc: "Tambah filter atau stiker sesuai keinginanmu.", img: "/step7.png" },
    { num: "8", title: "Cetak &\nKirim", desc: "Cetak langsung atau kirim ke perangkat HP milikmu!", img: "/step8.png" },
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-16 pb-16"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      
      {/* --- 0. PROGRESS BAR ATAS --- */}
      <div className="absolute top-0 left-0 w-full h-[12px]">
        {/* Track Abu Gelap (Rectangle 6) */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}
        ></div>
        {/* Progress Ijo (Rectangle 5) */}
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-500 ease-out"
          style={{ 
            width: '10%', // Nanti di halaman 'Pilih Paket' ganti ini jadi 25% atau 30% biar manjang
            background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' 
          }}
        ></div>
      </div>

      {/* --- 1. BADGE TUTORIAL ATAS --- */}
      <div 
        className="mb-8 flex items-center justify-center gap-3 shadow-md"
        style={{
          width: '224px',
          height: '56px',
          background: '#476A53',
          border: '1px solid #85DDA6',
          borderRadius: '28px',
        }}
      >
        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '24px',
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Tutorial
        </span>
      </div>

      {/* --- 2. HEADER TEXT (PANDUAN) --- */}
      <div className="flex flex-col items-center mb-10">
        <h3 
          className="uppercase tracking-[-0.1em] mb-[-10px]"
          style={{
            fontFamily: "'Hind Vadodara', sans-serif",
            fontWeight: 600,
            fontSize: '40px',
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          PANDUAN
        </h3>
        
        <h1 
          className="italic tracking-[-0.06em]"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '96px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '3px 5px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Tutorial Alur Penggunaan
        </h1>

        <div className="mt-4 flex items-center justify-center gap-4 w-[400px]">
          <div style={{ height: '3px', width: '100px', background: '#6AC5C3' }}></div>
          <div style={{ width: '15px', height: '15px', background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <div style={{ height: '3px', width: '100px', background: '#6AC5C3' }}></div>
        </div>
      </div>

      {/* --- 3. 8 CARDS GRID --- */}
      <div className="flex flex-nowrap justify-center gap-[15px] px-8 w-full max-w-[1800px] overflow-x-auto mb-16 pb-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center px-4 pt-6 pb-4 flex-none"
            style={{
              width: '181px',
              height: '367px',
              background: '#2E4F4D',
              border: '1.5px solid #54868A',
              borderRadius: '21px',
              boxSizing: 'border-box'
            }}
          >
            <span 
              className="mb-4"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                fontSize: '32px',
                color: '#6FFFB4',
                lineHeight: '39px'
              }}
            >
              {step.num}
            </span>

            <div 
              className="flex items-center justify-center mb-6 shadow-sm"
              style={{
                width: '63px',
                height: '63px',
                background: '#528A89',
                borderRadius: '8px'
              }}
            >
               <img src={step.img} alt={`Step ${step.num}`} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>

            <h3 
              className="mb-3 whitespace-pre-line"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '22px',
                lineHeight: '1.1',
                background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                height: '55px' 
              }}
            >
              {step.title}
            </h3>

            <p 
              className="tracking-[-0.06em]"
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 500,
                fontSize: '16px', 
                lineHeight: '1.2',
                color: '#ADC8C1'
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* --- 4. BOTTOM BUTTONS --- */}
      <div className="flex items-center gap-6">
        
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          style={{
            width: '217px',
            height: '49px',
            background: 'linear-gradient(90deg, #35967E 0%, #234D42 15.38%)',
            border: '3px solid #318570',
            borderRadius: '23px',
            boxSizing: 'border-box',
            textDecoration: 'none'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontStyle: 'italic', fontSize: '15px', color: '#0E1E1A' }}>
            KEMBALI
          </span>
        </Link>

        <Link 
          href="/pilih-paket" 
          className="flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          style={{
            width: '217px',
            height: '49px',
            background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)',
            border: '3px solid #318570',
            borderRadius: '23px',
            boxSizing: 'border-box',
            textDecoration: 'none'
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontStyle: 'italic', fontSize: '15px', color: '#1D4F42' }}>
            MENGERTI, BERIKUT
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        
      </div>

    </main>
  );
}