package models

import (
	"time"
)

// Struct Paket yang kemaren (biar ga ilang)
type Package struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	PackageID   string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"package_id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Badge       string    `gorm:"type:varchar(50)" json:"badge"`
	Price       int       `gorm:"not null" json:"price"`
	Duration    int       `gorm:"not null" json:"duration"`
	MaxPeople   int       `gorm:"not null" json:"max_people"`
	PrintCount  int       `gorm:"not null" json:"print_count"`
	IconURL     string    `gorm:"type:varchar(255)" json:"icon_url"`
	IsPopular   bool      `gorm:"default:false" json:"is_popular"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	Description string    `gorm:"type:text" json:"description"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// 2. TABEL TRANSAKSI (Sesuai analisis lu bro)
type Transaction struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TransactionID  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"transaction_id"` // TXN-20260521-0001
	OrderID        string    `gorm:"type:varchar(50);index" json:"order_id"`                      // GLAMBOT-1716382910
	PackageID      string    `gorm:"type:varchar(50);not null" json:"package_id"`                 // Ngedit ke package_id di tabel paket
	Amount         int       `gorm:"not null" json:"amount"`
	PaymentType    string    `gorm:"type:varchar(30)" json:"payment_type"`             // qris, gopay, dll
	Status         string    `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, success, failed, dll
	VoucherCode    string    `gorm:"type:varchar(50)" json:"voucher_code"`             // ⬅️ TAMBAH
	DiscountAmount int       `gorm:"default:0" json:"discount_amount"`                 // ⬅️ TAMBAH
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type PhotoSession struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TransactionID   string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"transaction_id"` // Jembatan ke tabel transaksi awal
	FrameID         string    `gorm:"type:varchar(20);not null" json:"frame_id"`                   // t1, t2, t3, t4
	TemplateName    string    `gorm:"type:varchar(100)" json:"template_name"`                      // e.g., "Classic Strip"
	OutputType      string    `gorm:"type:varchar(20);default:'Digital'" json:"output_type"`       // "Digital" atau "Cetak"
	FinalFramePath  string    `gorm:"type:varchar(255)" json:"final_frame_path"`                   // Hasil grid frame final
	ExtraPrintCount int       `gorm:"default:0" json:"extra_print_count"`
	PaymentStatus   string    `gorm:"type:varchar(20);default:'none'" json:"payment_status"` // pending, paid, failed, cancelled
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Photos          []Photo   `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE;" json:"photos"` // Relasi 1 ke N tabel photos
}

// TABEL FILTER FOTO
type Filter struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	CSS       string    `gorm:"type:varchar(255);not null" json:"css"`
	BgColor   string    `gorm:"type:varchar(50)" json:"bg_color"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Tabel: photos
type Photo struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SessionID  uint      `gorm:"index;not null" json:"session_id"`             // FK yang nge-link ke ID di photo_sessions
	PhotoPath  string    `gorm:"type:varchar(255);not null" json:"photo_path"` // Lokasi foto satuan dari DSLR
	SlotNumber int       `gorm:"not null" json:"slot_number"`                  // Slot 1, 2, 3, dst
	CreatedAt  time.Time `json:"created_at"`
}

// TABEL PENGATURAN GLOBAL (Hanya 1 baris data)
type Setting struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`

	// --- Dari Halaman Paket & Sesi ---
	DefaultSessionDuration int    `gorm:"default:300" json:"default_session_duration"`
	MerchantName           string `gorm:"type:varchar(100)" json:"merchant_name"`
	MerchantID             string `gorm:"type:varchar(50)" json:"merchant_id"`
	CameraResolution       string `gorm:"type:varchar(50);default:'1920x1080 (FHD)'" json:"camera_resolution"`
	CountdownTimer         int    `gorm:"default:5" json:"countdown_timer"`

	// --- Dari Halaman Pengaturan Umum ---
	BoothName     string `gorm:"type:varchar(100)" json:"booth_name"`
	BoothLocation string `gorm:"type:text" json:"booth_location"`
	BoothCode     string `gorm:"type:varchar(50)" json:"booth_code"`

	AdminName         string `gorm:"type:varchar(100)" json:"admin_name"`
	AdminPin          string `gorm:"type:varchar(4)" json:"admin_pin"` // Pake string biar 0 di depan ga ilang (misal: "0123")
	NotificationEmail string `gorm:"type:varchar(100)" json:"notification_email"`
	IsWhatsappNotifOn bool   `gorm:"default:true" json:"is_whatsapp_notif_on"`

	SplashText  string `gorm:"type:varchar(255)" json:"splash_text"`
	AccentColor string `gorm:"type:varchar(20)" json:"accent_color"`
	ActiveTheme string `gorm:"type:varchar(50);default:'Calm'" json:"active_theme"`

	UpdatedAt time.Time `json:"updated_at"`
}

// TABEL TEMPLATE & FRAME
type Template struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Description string `gorm:"type:varchar(255)" json:"description"` // Contoh: "Frame PNG · 3 foto · 1 sesi"
	Category    string `gorm:"type:varchar(30)" json:"category"`     // Buat filter tab: STRIP, GRID, COLLAGE, DUO
	LayoutType  string `gorm:"type:varchar(50)" json:"layout_type"`  // Dari dropdown: "Photo Strip (3 foto)", dll
	Theme       string `gorm:"type:varchar(50)" json:"theme"`        // Dari dropdown: "Classic (Gold)", dll
	IsCustomPNG bool   `gorm:"default:false" json:"is_custom_png"`   // Toggle Mode Frame PNG Kustom
	FramePath   string `gorm:"type:varchar(255)" json:"frame_path"`  // Buat nyimpen path gambar PNG transparannya nanti
	SlotCount   int    `gorm:"default:4" json:"slot_count"`

	OverlayTop    float64 `gorm:"default:10" json:"overlay_top"`    // % dari atas
	OverlayLeft   float64 `gorm:"default:10" json:"overlay_left"`   // % dari kiri
	OverlayRight  float64 `gorm:"default:10" json:"overlay_right"`  // % dari kanan
	OverlayBottom float64 `gorm:"default:10" json:"overlay_bottom"` // % dari bawah
	OverlayGap    float64 `gorm:"default:4" json:"overlay_gap"`     // % jarak antar slot
	OverlayCols   int     `gorm:"default:1" json:"overlay_cols"`    // 1=strip, 2=grid 2x, 3=grid 3x

	IsActive  bool      `gorm:"default:true" json:"is_active"` // Toggle Aktifkan template
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TABEL VOUCHER
type Voucher struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Code          string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"` // Contoh: "GLAMBOT50"
	DiscountType  string    `gorm:"type:varchar(20);not null" json:"discount_type"`    // "percentage", "nominal", "free"
	DiscountValue int       `gorm:"default:0" json:"discount_value"`                   // Contoh: 50 (buat 50%), 10000 (buat Rp), 0 (buat Gratis)
	Quota         int       `gorm:"not null" json:"quota"`                             // Batas maksimal dipakai (limit)
	Used          int       `gorm:"default:0" json:"used"`                             // Jumlah yang udah terpakai
	IsActive      bool      `gorm:"default:true" json:"is_active"`                     // Tombol OFF/ON dari admin
	ExpiredAt     time.Time `json:"expired_at"`                                        // Tanggal kadaluarsa
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// 9. MENU: PRINTER & HARDWARE (Gantiin struct Printer sebelumnya)
type Hardware struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`

	// --- Status Printer ---
	PrinterModel string `gorm:"type:varchar(50);default:'DNP DS620'" json:"printer_model"`
	PaperStock   int    `gorm:"default:400" json:"paper_stock"`
	RibbonStock  int    `gorm:"default:300" json:"ribbon_stock"`
	PrintedToday int    `gorm:"default:0" json:"printed_today"`
	IsFailTest   bool   `gorm:"default:false" json:"is_fail_test"`
	IsOffline    bool   `gorm:"default:false" json:"is_offline"`

	// --- Lampu & LED ---
	IsRingLightOn   bool `gorm:"default:true" json:"is_ring_light_on"`
	IsLedStripOn    bool `gorm:"default:true" json:"is_led_strip_on"`
	LightBrightness int  `gorm:"default:85" json:"light_brightness"`

	// --- Monitor & Display ---
	IsScreensaverOn bool `gorm:"default:true" json:"is_screensaver_on"`

	UpdatedAt time.Time `json:"updated_at"`
}
