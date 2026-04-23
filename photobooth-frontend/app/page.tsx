import Link from "next/link";

export default function Home() {
  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      
      {/* --- LAPISAN FOTO KELUARGA (UPGRADED VISIBILITY) --- */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/bg-keluarga.png" 
          alt="Family Portrait" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            opacity: 0.85, // Makin terang biar keliatan jelas
            filter: 'contrast(1.1) brightness(0.9)' // Nambah kontras dikit biar tajam
          }} 
        />
        {/* Overlay ditipisin biar fotonya nggak mendem warna gelap */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(36, 63, 66, 0.1) 0%, rgba(36, 63, 66, 0.7) 100%)'
          }}
        />
      </div>

      {/* --- KONTEN UTAMA (SHIFTED UPWARDS) --- */}
      {/* Pake -mt-20 buat narik semua konten ke atas */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 -mt-20">
        
        {/* 1. BADGE PREMIUM (DITARIK KE ATAS) */}
        <div 
          className="mb-12 flex items-center justify-center gap-2"
          style={{
            width: '342px',
            height: '37px',
            background: '#476A53',
            border: '1px solid #85DDA6',
            borderRadius: '18.5px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ width: '18px', height: '18px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <span 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '19px',
              background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Premium Glambot Photo Studio
          </span>
        </div>

        {/* 2. LOGO & TEKS GLAMBOT STUDIO */}
        <div className="mb-10 flex items-center justify-center gap-[15px]">
          <div 
            className="flex items-center justify-center shadow-lg"
            style={{
              width: '77px',
              height: '77px',
              background: 'linear-gradient(180deg, #48CF8D 0%, #245F69 100%)',
              border: '1px solid #ACFFC1',
              borderRadius: '9px',
              boxSizing: 'border-box'
            }}
          >
             <img src="/image2.png" alt="Camera Icon" style={{ width: '41px', height: '41px' }} />
          </div>
          <h2 
            className="italic drop-shadow-md"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '48px',
              lineHeight: '58px',
              background: 'linear-gradient(90deg, #FFFFFF 0%, #999999 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}
          >
            GLAMBOT<span style={{ fontWeight: 300 }}>STUDIO</span>
          </h2>
        </div>

        {/* 3. MAIN TITLE */}
        <div className="mb-6 flex flex-col items-center">
          <h1 
            className="italic drop-shadow-xl"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '96px',
              color: '#FFFFFF',
              lineHeight: '90px', 
              letterSpacing: '-0.04em',
              margin: 0
            }}
          >
            Abadikan Momen
          </h1>
          <h1 
            className="italic drop-shadow-xl"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '110px',
              background: 'linear-gradient(273.8deg, #74BECD 23.66%, #96E4A9 63.36%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '110px',
              letterSpacing: '-0.04em',
              margin: 0
            }}
          >
            Terbaik Kamu
          </h1>
        </div>

        {/* 4. SUBTITLE */}
        <p 
          className="mb-10"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 300,
            fontSize: '20px',
            color: '#A2E3CA',
            textAlign: 'center',
            lineHeight: '1.4',
            maxWidth: '600px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Robot arm kamera otomatis dengan filter premium & cetak instan<br/>
          Pengalaman foto mandiri yang tak terlupakan.
        </p>

        {/* --- 5. TOMBOL TOUCH BAWAH --- */}
        <Link href="/tutorial" className="group relative flex h-[184px] w-[184px] items-center justify-center cursor-pointer">
          <div className="absolute transition-transform duration-500 group-hover:scale-110" style={{ width: '184px', height: '184px', borderRadius: '50%', background: 'radial-gradient(75% 75% at 50% 50%, #48C5A6 25%, rgba(35, 95, 80, 0) 48.08%)' }}></div>
          <div className="absolute transition-transform duration-700 group-hover:rotate-180" style={{ width: '158px', height: '158px', borderRadius: '50%', border: '1px dashed #27B18A', boxSizing: 'border-box' }}></div>
          <div className="absolute" style={{ width: '137px', height: '137px', borderRadius: '50%', border: '1px solid #27B18A', boxSizing: 'border-box' }}></div>
          <div className="absolute flex items-center justify-center transition-transform duration-300 group-hover:scale-105" style={{ width: '106px', height: '106px', borderRadius: '50%', background: '#48C5A6' }}>
             <img src="/image1.png" alt="Touch" style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>

      </div>
    </main>
  );
}