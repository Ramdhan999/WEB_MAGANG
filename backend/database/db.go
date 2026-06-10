package database

import (
	"backend-photobooth/models" // Ganti 'proyek-lu' dengan nama module go.mod lu
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Pastikan database 'glambot_db' udah lu bikin di Laragon (PHPMyAdmin)
	dsn := "root:@tcp(127.0.0.1:3306)/glambot_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal konek ke database:", err)
	}

	// SAKTI DI SINI: GORM bakal bikin tabel otomatis berdasarkan struct model
	// Di dalam file database/db.go lu, ubah baris migrasinya jadi gini:
	// Pastiin AutoMigrate lu sekarang ada 5 struct ini bro:
	// Pastiin AutoMigrate lu sekarang nambahin models.Template{}
	db.AutoMigrate(
		&models.Package{},
		&models.Transaction{},
		&models.PhotoSession{},
		&models.Photo{},
		&models.Setting{},
		&models.Template{}, // <--- Tambahan baru
		&models.Voucher{},
		&models.Hardware{},
		&models.Filter{},
	)

	DB = db
	log.Println("Database terkoneksi & tabel siap!")
}
