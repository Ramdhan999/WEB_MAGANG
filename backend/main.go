package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Inisiasi router Gin bawaan
	r := gin.Default()

	// Bikin endpoint (API) sederhana buat testing
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Pong! Backend Golang pake Gin udah ready bro 🚀",
		})
	})

	// Jalanin server di port 8080
	r.Run(":8080")
}
