-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: glambot_db
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `filters`
--

DROP TABLE IF EXISTS `filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `filters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `css` varchar(255) NOT NULL,
  `bg_color` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `filters`
--

LOCK TABLES `filters` WRITE;
/*!40000 ALTER TABLE `filters` DISABLE KEYS */;
INSERT INTO `filters` VALUES (1,'Vintage','sepia(60%) contrast(90%)','bg-[#F3F3F3]',1,'2026-05-22 13:08:58.630','2026-05-22 13:08:58.630'),(2,'Noir','grayscale(100%) contrast(120%)','bg-[#F3F3F3]',1,'2026-06-10 11:42:40.593','2026-06-10 11:42:40.593'),(3,'Vivid','saturate(180%)','bg-[#F3F3F3]',1,'2026-06-10 11:42:48.963','2026-06-10 11:42:48.963'),(4,'Warm','sepia(30%) saturate(140%)','bg-[#F3F3F3]',1,'2026-06-10 11:42:57.918','2026-06-10 11:42:57.918'),(5,'Cool','hue-rotate(30deg) saturate(120%)','bg-[#F3F3F3]',1,'2026-06-10 11:43:05.193','2026-06-10 11:43:05.193'),(6,'Drama','contrast(150%) saturate(80%)','bg-[#F3F3F3]',1,'2026-06-10 11:43:16.378','2026-06-10 11:43:16.378'),(7,'Soft','brightness(110%) contrast(85%) blur(1px)','bg-[#F3F3F3]',1,'2026-06-10 11:43:31.192','2026-06-10 11:43:31.192'),(8,'Film','sepia(20%) contrast(110%) brightness(95%)','bg-[#F3F3F3]',1,'2026-06-10 11:43:38.636','2026-06-10 11:43:38.636');
/*!40000 ALTER TABLE `filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hardwares`
--

DROP TABLE IF EXISTS `hardwares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hardwares` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `printer_model` varchar(50) DEFAULT 'DNP DS620',
  `paper_stock` bigint DEFAULT '400',
  `ribbon_stock` bigint DEFAULT '300',
  `printed_today` bigint DEFAULT '0',
  `is_fail_test` tinyint(1) DEFAULT '0',
  `is_offline` tinyint(1) DEFAULT '0',
  `is_ring_light_on` tinyint(1) DEFAULT '1',
  `is_led_strip_on` tinyint(1) DEFAULT '1',
  `light_brightness` bigint DEFAULT '85',
  `is_screensaver_on` tinyint(1) DEFAULT '1',
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hardwares`
--

LOCK TABLES `hardwares` WRITE;
/*!40000 ALTER TABLE `hardwares` DISABLE KEYS */;
/*!40000 ALTER TABLE `hardwares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` bigint DEFAULT NULL,
  `desc` longtext,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `badge` varchar(50) DEFAULT NULL,
  `duration` bigint DEFAULT NULL,
  `people` bigint DEFAULT NULL,
  `print` bigint DEFAULT NULL,
  `icon` longtext,
  `status` longtext,
  `package_id` varchar(50) NOT NULL,
  `max_people` bigint NOT NULL,
  `print_count` bigint NOT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `description` text,
  `sort_order` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_packages_package_id` (`package_id`),
  KEY `idx_packages_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES (10,'Glambot Solo',55000,NULL,'2026-05-21 19:53:35.084','2026-06-10 14:45:33.474',NULL,'solo',10,NULL,NULL,NULL,NULL,'solo',2,1,'http://localhost:8080/uploads/paket_1779367981937724600.png',0,1,'',0),(11,'Glambot group',75000,NULL,'2026-05-21 19:59:52.350','2026-06-09 14:10:47.438',NULL,'Group',1,NULL,NULL,NULL,NULL,'group',2,1,'http://localhost:8080/uploads/paket_1779368378546506100.png',1,1,'',0),(13,'Paket Duo',45000,NULL,'2026-06-10 15:31:35.625','2026-06-10 15:31:35.625',NULL,'DUO',5,NULL,NULL,NULL,NULL,'duo',2,1,'http://localhost:8080/uploads/paket_1781080285441180200.png',0,1,'',0);
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photo_sessions`
--

DROP TABLE IF EXISTS `photo_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photo_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) NOT NULL,
  `frame_id` varchar(20) NOT NULL,
  `template_name` varchar(100) DEFAULT NULL,
  `output_type` varchar(20) DEFAULT 'Digital',
  `final_frame_path` varchar(255) DEFAULT NULL,
  `extra_print_count` bigint DEFAULT '0',
  `payment_status` varchar(20) DEFAULT 'none',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_photo_sessions_transaction_id` (`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photo_sessions`
--

LOCK TABLES `photo_sessions` WRITE;
/*!40000 ALTER TABLE `photo_sessions` DISABLE KEYS */;
INSERT INTO `photo_sessions` VALUES (1,'TXN-20260521-233353-7709','t3','Frame','Digital','',0,'none','2026-05-21 23:34:21.540','2026-05-21 23:34:21.540'),(2,'TXN-20260521-235704-5637','','','Digital','',0,'none','2026-05-21 23:57:57.026','2026-05-21 23:57:57.026'),(6,'TXN-20260522-001656-9FB2','','','Digital','',0,'none','2026-05-22 00:17:15.842','2026-05-22 00:17:15.842'),(8,'TXN-20260522-001857-837C','t4','Classic','Digital','',0,'none','2026-05-22 00:19:14.369','2026-05-22 00:21:02.379'),(10,'TXN-20260522-084541-24A8','t5','Dua','Digital','',0,'none','2026-05-22 08:45:57.529','2026-05-22 09:04:12.646'),(12,'TXN-20260522-095205-6093','','','Digital','',0,'none','2026-05-22 09:52:32.984','2026-05-22 09:52:32.984'),(14,'TXN-20260522-101624-89A6','t4','Classic','Digital','',0,'none','2026-05-22 10:17:40.183','2026-05-22 10:17:48.487'),(16,'TXN-20260522-123114-F60F','t5','Dua','Digital','',0,'none','2026-05-22 12:31:42.936','2026-05-22 12:32:00.158'),(18,'TXN-20260522-130415-2C1C','t5','Dua','Digital','',0,'none','2026-05-22 13:04:38.110','2026-05-22 13:05:04.137'),(20,'TXN-20260522-133215-FDBA','t5','Dua','Digital','',0,'none','2026-05-22 13:32:47.382','2026-05-22 13:33:03.112'),(22,'TXN-20260522-133427-19DF','t4','Classic','Digital','',0,'none','2026-05-22 13:34:48.218','2026-05-22 13:35:01.606'),(24,'TXN-20260522-151536-9F33','t5','Dua','Digital','',0,'none','2026-05-22 15:16:14.900','2026-05-22 15:16:27.638'),(26,'TXN-20260522-152128-1AE1','t3','Frame','Digital','',0,'none','2026-05-22 15:21:44.231','2026-05-22 15:23:26.061'),(28,'TXN-20260522-153243-5223','','','Digital','',0,'none','2026-05-22 15:33:09.214','2026-05-22 15:33:09.214'),(30,'TXN-20260522-160858-3D0B','t4','Classic','Digital','',0,'none','2026-05-22 16:09:18.630','2026-05-22 16:40:25.089'),(32,'TXN-20260522-165355-FE42','','','Digital','',0,'none','2026-05-22 16:54:16.444','2026-05-22 16:54:16.444'),(34,'TXN-20260522-170055-256C','','','Digital','',0,'none','2026-05-22 17:01:26.719','2026-05-22 17:01:26.719'),(36,'TXN-20260525-202917-BFFF','t5','Dua','Digital','',2,'paid','2026-05-25 20:29:46.627','2026-05-25 21:16:11.469'),(38,'TXN-20260525-212643-E79A','t5','Dua','Digital','',0,'none','2026-05-25 21:27:01.007','2026-05-25 21:28:11.870'),(39,'TXN-20260525-215538-065E','','','Digital','',0,'none','2026-05-25 21:56:01.310','2026-05-25 21:56:01.310'),(41,'TXN-20260525-222507-C7B4','','','Digital','',0,'none','2026-05-25 22:25:24.755','2026-05-25 22:25:24.755'),(44,'TXN-20260525-231602-8315','t5','Dua','Digital','',0,'none','2026-05-25 23:16:20.735','2026-05-25 23:34:12.181'),(45,'TXN-20260526-080600-2483','','','Digital','',0,'none','2026-05-26 08:06:33.198','2026-05-26 08:06:33.198'),(47,'TXN-20260526-091256-324B','','','Digital','',0,'none','2026-05-26 09:13:16.756','2026-05-26 09:13:16.756'),(49,'TXN-20260526-091553-28A5','','','Digital','',0,'none','2026-05-26 09:16:12.099','2026-05-26 09:16:12.099'),(51,'TXN-20260526-092954-D7B5','','','Digital','',0,'none','2026-05-26 09:30:13.551','2026-05-26 09:30:13.551'),(53,'TXN-20260526-093632-FBC0','t5','Dua','Digital','',0,'none','2026-05-26 09:36:50.280','2026-05-26 09:42:08.114'),(55,'TXN-20260526-095613-0D86','t5','Dua','Digital','',0,'none','2026-05-26 09:56:32.087','2026-05-26 10:02:01.090'),(57,'TXN-20260608-135007-FA3F','t3','Frame','Digital','',0,'none','2026-06-08 13:50:38.580','2026-06-08 13:58:05.650'),(58,'TXN-20260608-140832-AFEA','','','Digital','',0,'none','2026-06-08 14:09:00.120','2026-06-08 14:09:00.120'),(60,'TXN-20260608-141605-B4DC','t3','Frame','Digital','',0,'none','2026-06-08 14:16:33.728','2026-06-08 14:22:02.434'),(62,'TXN-20260609-134708-568D','','','Digital','',0,'none','2026-06-09 13:48:38.652','2026-06-09 13:48:38.652'),(64,'TXN-20260609-140026-9CB2','','','Digital','',0,'none','2026-06-09 14:00:41.050','2026-06-09 14:00:41.050'),(66,'TXN-20260609-140102-7711','','','Digital','',0,'none','2026-06-09 14:01:16.518','2026-06-09 14:01:16.518'),(68,'TXN-20260609-140716-EA42','','','Digital','',0,'none','2026-06-09 14:07:33.438','2026-06-09 14:07:33.438'),(70,'TXN-20260609-140905-90DB','','','Digital','',0,'none','2026-06-09 14:09:21.457','2026-06-09 14:09:21.457'),(72,'TXN-20260609-141059-ACFF','t6','Classic','Cetak','',0,'none','2026-06-09 14:11:16.605','2026-06-09 14:33:50.635'),(74,'TXN-20260609-150054-86C2','t4','Classic','Cetak','',0,'none','2026-06-09 15:01:14.317','2026-06-09 15:05:56.911'),(76,'TXN-20260609-151023-B740','t9','Paket 2 Jam','Cetak','',0,'none','2026-06-09 15:10:39.996','2026-06-09 16:17:58.471'),(78,'TXN-20260609-163542-5D42','','','Digital','',0,'none','2026-06-09 16:36:04.116','2026-06-09 16:36:04.116'),(80,'TXN-20260609-164057-AD43','','','Digital','',0,'none','2026-06-09 16:41:15.743','2026-06-09 16:41:15.743'),(82,'TXN-20260609-164929-7D04','','','Digital','',0,'none','2026-06-09 16:49:47.241','2026-06-09 16:49:47.241'),(84,'TXN-20260609-165106-6B81','','','Digital','',0,'none','2026-06-09 16:51:22.537','2026-06-09 16:51:22.537'),(86,'TXN-20260610-090406-941B','t16','Easster','Digital','',0,'none','2026-06-10 09:04:36.504','2026-06-10 12:17:43.995'),(88,'TXN-20260610-140936-E860','t13','Pixel Minecraft','Digital','',0,'none','2026-06-10 14:10:01.387','2026-06-10 14:12:00.033'),(90,'TXN-20260610-141327-1671','t15','17 Agustus','Digital','',0,'none','2026-06-10 14:13:52.508','2026-06-10 14:42:45.882'),(92,'TXN-20260610-151024-F5B8','t9','Pixel Minecraft','Digital','',0,'none','2026-06-10 15:10:44.363','2026-06-10 15:12:29.823'),(94,'TXN-20260610-151246-33E6','t20','Valentine','Digital','',0,'none','2026-06-10 15:13:05.839','2026-06-10 15:45:55.848'),(96,'TXN-20260610-154739-F253','t19','China','Digital','',0,'none','2026-06-10 15:48:04.643','2026-06-10 15:49:56.040'),(98,'TXN-20260610-155107-8E63','t18','China','Cetak','',0,'none','2026-06-10 15:51:38.156','2026-06-10 16:07:03.469'),(100,'TXN-20260610-162556-6C8B','','','Digital','',0,'none','2026-06-10 16:26:15.763','2026-06-10 16:26:15.763'),(102,'TXN-20260610-162733-2B47','t15','17 Agustus','Cetak','',0,'none','2026-06-10 16:27:50.209','2026-06-10 16:36:26.375'),(104,'TXN-20260610-170603-6F1C','','','Digital','',0,'none','2026-06-10 17:06:20.049','2026-06-10 17:06:20.049'),(106,'TXN-20260610-170739-E066','','','Digital','',0,'none','2026-06-10 17:07:55.101','2026-06-10 17:07:55.101'),(108,'TXN-20260610-171005-7444','t20','Valentine','Digital','',0,'none','2026-06-10 17:10:25.516','2026-06-10 19:34:17.532'),(110,'TXN-20260610-193438-237E','t13','Pixel Minecraft','Digital','',0,'none','2026-06-10 19:34:55.283','2026-06-10 19:36:06.101'),(112,'TXN-20260610-194439-B852','t13','Pixel Minecraft','Digital','',0,'none','2026-06-10 19:45:12.963','2026-06-10 19:46:38.886'),(114,'TXN-20260610-204650-CFAB','','','Digital','',0,'none','2026-06-10 20:47:26.021','2026-06-10 20:47:26.021'),(116,'TXN-20260610-213225-5310','','','Digital','',0,'none','2026-06-10 21:32:35.175','2026-06-10 21:32:35.175'),(118,'TXN-20260610-213252-9F5D','','','Digital','',0,'none','2026-06-10 21:33:01.432','2026-06-10 21:33:01.432'),(120,'TXN-20260610-213417-45C5','','','Digital','',0,'none','2026-06-10 21:34:36.399','2026-06-10 21:34:36.399');
/*!40000 ALTER TABLE `photo_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `photo_path` varchar(255) NOT NULL,
  `slot_number` bigint NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_photos_session_id` (`session_id`),
  CONSTRAINT `fk_photo_sessions_photos` FOREIGN KEY (`session_id`) REFERENCES `photo_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=271 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photos`
--

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` VALUES (1,8,'https://picsum.photos/seed/1779383956678375600/1200/800',1,'2026-05-22 00:19:16.680'),(2,8,'https://picsum.photos/seed/1779383959496936800/1200/800',2,'2026-05-22 00:19:19.497'),(3,8,'https://picsum.photos/seed/1779383974017226100/1200/800',3,'2026-05-22 00:19:34.018'),(4,8,'https://picsum.photos/seed/1779383975174374400/1200/800',4,'2026-05-22 00:19:35.174'),(5,8,'https://picsum.photos/seed/1779383975881199100/1200/800',5,'2026-05-22 00:19:35.881'),(6,10,'https://picsum.photos/seed/1779414359726563400/1200/800',1,'2026-05-22 08:45:59.727'),(7,10,'https://picsum.photos/seed/1779414360590240600/1200/800',2,'2026-05-22 08:46:00.591'),(8,10,'https://picsum.photos/seed/1779414361418355300/1200/800',3,'2026-05-22 08:46:01.419'),(9,10,'https://picsum.photos/seed/1779414362106780300/1200/800',4,'2026-05-22 08:46:02.107'),(10,10,'https://picsum.photos/seed/1779414362947159200/1200/800',5,'2026-05-22 08:46:02.947'),(11,12,'https://picsum.photos/seed/1779418356003857500/1200/800',1,'2026-05-22 09:52:36.005'),(12,12,'https://picsum.photos/seed/1779418356659622300/1200/800',2,'2026-05-22 09:52:36.660'),(13,12,'https://picsum.photos/seed/1779418357531883700/1200/800',3,'2026-05-22 09:52:37.533'),(14,12,'https://picsum.photos/seed/1779418358207499500/1200/800',4,'2026-05-22 09:52:38.207'),(15,14,'https://picsum.photos/seed/1779419861043075700/1200/800',1,'2026-05-22 10:17:41.044'),(16,14,'https://picsum.photos/seed/1779419862050657200/1200/800',2,'2026-05-22 10:17:42.051'),(17,14,'https://picsum.photos/seed/1779419863075158200/1200/800',3,'2026-05-22 10:17:43.076'),(18,14,'https://picsum.photos/seed/1779419863970222400/1200/800',4,'2026-05-22 10:17:43.971'),(19,16,'https://picsum.photos/seed/1779427907603287300/1200/800',1,'2026-05-22 12:31:47.603'),(20,16,'https://picsum.photos/seed/1779427908189681200/1200/800',2,'2026-05-22 12:31:48.190'),(21,16,'https://picsum.photos/seed/1779427908785783000/1200/800',3,'2026-05-22 12:31:48.786'),(22,16,'https://picsum.photos/seed/1779427909453680100/1200/800',4,'2026-05-22 12:31:49.454'),(23,16,'https://picsum.photos/seed/1779427910025738600/1200/800',5,'2026-05-22 12:31:50.026'),(24,16,'https://picsum.photos/seed/1779427910558295800/1200/800',6,'2026-05-22 12:31:50.559'),(25,16,'https://picsum.photos/seed/1779427911166229700/1200/800',7,'2026-05-22 12:31:51.167'),(26,18,'https://picsum.photos/seed/1779429879224356100/1200/800',1,'2026-05-22 13:04:39.224'),(27,18,'https://picsum.photos/seed/1779429880072164900/1200/800',2,'2026-05-22 13:04:40.073'),(28,18,'https://picsum.photos/seed/1779429880896163500/1200/800',3,'2026-05-22 13:04:40.896'),(29,18,'https://picsum.photos/seed/1779429881731930500/1200/800',4,'2026-05-22 13:04:41.732'),(30,18,'https://picsum.photos/seed/1779429884387092800/1200/800',5,'2026-05-22 13:04:44.388'),(31,20,'https://picsum.photos/seed/1779431569454410200/1200/800',1,'2026-05-22 13:32:49.455'),(32,20,'https://picsum.photos/seed/1779431570329821900/1200/800',2,'2026-05-22 13:32:50.330'),(33,20,'https://picsum.photos/seed/1779431571146360300/1200/800',3,'2026-05-22 13:32:51.147'),(34,20,'https://picsum.photos/seed/1779431571990486200/1200/800',4,'2026-05-22 13:32:51.991'),(35,20,'https://picsum.photos/seed/1779431572809838500/1200/800',5,'2026-05-22 13:32:52.810'),(36,20,'https://picsum.photos/seed/1779431573693829000/1200/800',6,'2026-05-22 13:32:53.694'),(37,20,'https://picsum.photos/seed/1779431574241627000/1200/800',7,'2026-05-22 13:32:54.242'),(38,20,'https://picsum.photos/seed/1779431574904509600/1200/800',8,'2026-05-22 13:32:54.905'),(39,20,'https://picsum.photos/seed/1779431575516407500/1200/800',9,'2026-05-22 13:32:55.516'),(40,20,'https://picsum.photos/seed/1779431576075766400/1200/800',10,'2026-05-22 13:32:56.076'),(41,20,'https://picsum.photos/seed/1779431576696613400/1200/800',11,'2026-05-22 13:32:56.697'),(42,20,'https://picsum.photos/seed/1779431577271692500/1200/800',12,'2026-05-22 13:32:57.272'),(43,20,'https://picsum.photos/seed/1779431577888497500/1200/800',13,'2026-05-22 13:32:57.889'),(44,20,'https://picsum.photos/seed/1779431578484542300/1200/800',14,'2026-05-22 13:32:58.485'),(45,20,'https://picsum.photos/seed/1779431579075632300/1200/800',15,'2026-05-22 13:32:59.076'),(46,22,'https://picsum.photos/seed/1779431689375285600/1200/800',1,'2026-05-22 13:34:49.375'),(47,22,'https://picsum.photos/seed/1779431690056177200/1200/800',2,'2026-05-22 13:34:50.056'),(48,22,'https://picsum.photos/seed/1779431690751107900/1200/800',3,'2026-05-22 13:34:50.752'),(49,22,'https://picsum.photos/seed/1779431691475301900/1200/800',4,'2026-05-22 13:34:51.476'),(50,22,'https://picsum.photos/seed/1779431692103226500/1200/800',5,'2026-05-22 13:34:52.103'),(51,22,'https://picsum.photos/seed/1779431692719852300/1200/800',6,'2026-05-22 13:34:52.720'),(52,22,'https://picsum.photos/seed/1779431693313575600/1200/800',7,'2026-05-22 13:34:53.314'),(53,22,'https://picsum.photos/seed/1779431694045221900/1200/800',8,'2026-05-22 13:34:54.046'),(54,22,'https://picsum.photos/seed/1779431694654140100/1200/800',9,'2026-05-22 13:34:54.655'),(55,22,'https://picsum.photos/seed/1779431695290748400/1200/800',10,'2026-05-22 13:34:55.291'),(56,22,'https://picsum.photos/seed/1779431695909092300/1200/800',11,'2026-05-22 13:34:55.910'),(57,22,'https://picsum.photos/seed/1779431696705566100/1200/800',12,'2026-05-22 13:34:56.706'),(58,22,'https://picsum.photos/seed/1779431697340957000/1200/800',13,'2026-05-22 13:34:57.342'),(59,22,'https://picsum.photos/seed/1779431697965106100/1200/800',14,'2026-05-22 13:34:57.966'),(60,22,'https://picsum.photos/seed/1779431698545633700/1200/800',15,'2026-05-22 13:34:58.546'),(61,24,'https://picsum.photos/seed/1779437777000174700/1200/800',1,'2026-05-22 15:16:17.001'),(62,24,'https://picsum.photos/seed/1779437777668365100/1200/800',2,'2026-05-22 15:16:17.668'),(63,24,'https://picsum.photos/seed/1779437778265502800/1200/800',3,'2026-05-22 15:16:18.266'),(64,24,'https://picsum.photos/seed/1779437779050433900/1200/800',4,'2026-05-22 15:16:19.053'),(65,24,'https://picsum.photos/seed/1779437779679952900/1200/800',5,'2026-05-22 15:16:19.680'),(66,26,'https://picsum.photos/seed/1779438195261226900/1200/800',1,'2026-05-22 15:23:15.261'),(67,26,'https://picsum.photos/seed/1779438196250997500/1200/800',2,'2026-05-22 15:23:16.252'),(68,26,'https://picsum.photos/seed/1779438197202574800/1200/800',3,'2026-05-22 15:23:17.203'),(69,26,'https://picsum.photos/seed/1779438198241961500/1200/800',4,'2026-05-22 15:23:18.242'),(70,26,'https://picsum.photos/seed/1779438199084200300/1200/800',5,'2026-05-22 15:23:19.086'),(71,30,'https://picsum.photos/seed/1779442817707358300/1200/800',1,'2026-05-22 16:40:17.707'),(72,36,'https://picsum.photos/seed/1779715790802264900/1200/800',1,'2026-05-25 20:29:50.803'),(73,36,'https://picsum.photos/seed/1779715791704941900/1200/800',2,'2026-05-25 20:29:51.706'),(74,36,'https://picsum.photos/seed/1779715792593121900/1200/800',3,'2026-05-25 20:29:52.594'),(75,36,'https://picsum.photos/seed/1779715805901149500/1200/800',4,'2026-05-25 20:30:05.902'),(76,36,'https://picsum.photos/seed/1779715806801935600/1200/800',5,'2026-05-25 20:30:06.802'),(77,36,'https://picsum.photos/seed/1779715807385543700/1200/800',6,'2026-05-25 20:30:07.386'),(78,36,'https://picsum.photos/seed/1779715807969737600/1200/800',7,'2026-05-25 20:30:07.970'),(79,36,'https://picsum.photos/seed/1779715808555707600/1200/800',8,'2026-05-25 20:30:08.556'),(80,36,'https://picsum.photos/seed/1779715809179249700/1200/800',9,'2026-05-25 20:30:09.180'),(81,36,'https://picsum.photos/seed/1779715809808675000/1200/800',10,'2026-05-25 20:30:09.809'),(82,36,'https://picsum.photos/seed/1779715810402574900/1200/800',11,'2026-05-25 20:30:10.403'),(83,36,'https://picsum.photos/seed/1779715811046672700/1200/800',12,'2026-05-25 20:30:11.047'),(84,36,'https://picsum.photos/seed/1779715811691538800/1200/800',13,'2026-05-25 20:30:11.692'),(85,36,'https://picsum.photos/seed/1779715812462941200/1200/800',14,'2026-05-25 20:30:12.464'),(86,36,'https://picsum.photos/seed/1779715813086666200/1200/800',15,'2026-05-25 20:30:13.087'),(87,38,'https://picsum.photos/seed/1779719222003985000/1200/800',1,'2026-05-25 21:27:02.004'),(88,38,'https://picsum.photos/seed/1779719222710115100/1200/800',2,'2026-05-25 21:27:02.711'),(89,38,'https://picsum.photos/seed/1779719223395816400/1200/800',3,'2026-05-25 21:27:03.396'),(90,38,'https://picsum.photos/seed/1779719223991081900/1200/800',4,'2026-05-25 21:27:03.992'),(91,38,'https://picsum.photos/seed/1779719224574347900/1200/800',5,'2026-05-25 21:27:04.575'),(92,38,'https://picsum.photos/seed/1779719225178467700/1200/800',6,'2026-05-25 21:27:05.179'),(93,38,'https://picsum.photos/seed/1779719225786010300/1200/800',7,'2026-05-25 21:27:05.787'),(94,38,'https://picsum.photos/seed/1779719226438820000/1200/800',8,'2026-05-25 21:27:06.439'),(95,38,'https://picsum.photos/seed/1779719227053788200/1200/800',9,'2026-05-25 21:27:07.054'),(96,38,'https://picsum.photos/seed/1779719227685458000/1200/800',10,'2026-05-25 21:27:07.686'),(97,38,'https://picsum.photos/seed/1779719228362688500/1200/800',11,'2026-05-25 21:27:08.363'),(98,38,'https://picsum.photos/seed/1779719228984507700/1200/800',12,'2026-05-25 21:27:08.985'),(99,38,'https://picsum.photos/seed/1779719229616009300/1200/800',13,'2026-05-25 21:27:09.616'),(100,38,'https://picsum.photos/seed/1779719230243364200/1200/800',14,'2026-05-25 21:27:10.244'),(101,38,'https://picsum.photos/seed/1779719230859303100/1200/800',15,'2026-05-25 21:27:10.860'),(102,39,'https://picsum.photos/seed/1779720963053415900/1200/800',1,'2026-05-25 21:56:03.054'),(103,39,'https://picsum.photos/seed/1779720963756874700/1200/800',2,'2026-05-25 21:56:03.757'),(104,39,'https://picsum.photos/seed/1779720964388977500/1200/800',3,'2026-05-25 21:56:04.389'),(105,39,'https://picsum.photos/seed/1779720964981198800/1200/800',4,'2026-05-25 21:56:04.981'),(106,39,'https://picsum.photos/seed/1779720965638901000/1200/800',5,'2026-05-25 21:56:05.639'),(107,39,'https://picsum.photos/seed/1779720968727460100/1200/800',6,'2026-05-25 21:56:08.728'),(108,39,'https://picsum.photos/seed/1779720969430759800/1200/800',7,'2026-05-25 21:56:09.431'),(109,39,'https://picsum.photos/seed/1779720970155782100/1200/800',8,'2026-05-25 21:56:10.156'),(110,39,'https://picsum.photos/seed/1779720971244066500/1200/800',9,'2026-05-25 21:56:11.245'),(111,39,'https://picsum.photos/seed/1779720971966994300/1200/800',10,'2026-05-25 21:56:11.968'),(112,41,'https://picsum.photos/seed/1779723087057549900/1200/800',1,'2026-05-25 22:31:27.058'),(113,44,'https://picsum.photos/seed/1779725801550811300/1200/800',1,'2026-05-25 23:16:41.551'),(114,44,'https://picsum.photos/seed/1779725802550550500/1200/800',2,'2026-05-25 23:16:42.551'),(115,44,'https://picsum.photos/seed/1779725803182538700/1200/800',3,'2026-05-25 23:16:43.183'),(116,44,'https://picsum.photos/seed/1779725804582699300/1200/800',4,'2026-05-25 23:16:44.583'),(117,44,'https://picsum.photos/seed/1779725805294581500/1200/800',5,'2026-05-25 23:16:45.295'),(118,44,'https://picsum.photos/seed/1779726800015367000/1200/800',6,'2026-05-25 23:33:20.016'),(119,44,'https://picsum.photos/seed/1779726800558689400/1200/800',7,'2026-05-25 23:33:20.559'),(120,44,'https://picsum.photos/seed/1779726801183952800/1200/800',8,'2026-05-25 23:33:21.184'),(121,44,'https://picsum.photos/seed/1779726801799809000/1200/800',9,'2026-05-25 23:33:21.800'),(122,44,'https://picsum.photos/seed/1779726802463323000/1200/800',10,'2026-05-25 23:33:22.464'),(123,49,'https://picsum.photos/seed/1779761815846670300/1200/800',1,'2026-05-26 09:16:55.847'),(124,49,'https://picsum.photos/seed/1779761837182602200/1200/800',2,'2026-05-26 09:17:17.183'),(125,51,'https://picsum.photos/seed/1779762725078578300/1200/800',1,'2026-05-26 09:32:05.079'),(126,51,'https://picsum.photos/seed/1779762739574553400/1200/800',2,'2026-05-26 09:32:19.575'),(127,51,'https://picsum.photos/seed/1779762777586527300/1200/800',3,'2026-05-26 09:32:57.587'),(128,53,'https://picsum.photos/seed/1779763048369989900/1200/800',1,'2026-05-26 09:37:28.371'),(129,53,'https://picsum.photos/seed/1779763086365246400/1200/800',2,'2026-05-26 09:38:06.365'),(130,53,'https://picsum.photos/seed/1779763160366686300/1200/800',3,'2026-05-26 09:39:20.367'),(131,53,'https://picsum.photos/seed/1779763202365286400/1200/800',4,'2026-05-26 09:40:02.365'),(132,53,'https://picsum.photos/seed/1779763215370065500/1200/800',5,'2026-05-26 09:40:15.370'),(133,53,'https://picsum.photos/seed/1779763240869702100/1200/800',6,'2026-05-26 09:40:40.870'),(134,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764246647231900.jpg',1,'2026-05-26 09:57:26.648'),(135,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764256636790500.jpg',2,'2026-05-26 09:57:36.639'),(136,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764281637639800.jpg',3,'2026-05-26 09:58:01.639'),(137,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764290630877100.jpg',4,'2026-05-26 09:58:10.632'),(138,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764300135148000.jpg',5,'2026-05-26 09:58:20.146'),(139,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764308634485100.jpg',6,'2026-05-26 09:58:28.649'),(140,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764402650632900.jpg',7,'2026-05-26 10:00:02.652'),(141,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764411149623600.jpg',8,'2026-05-26 10:00:11.151'),(142,55,'http://localhost:8080/photos/sessions/TXN-20260526-095613-0D86/webcam_1779764451158972500.jpg',9,'2026-05-26 10:00:51.161'),(143,57,'http://localhost:8080/photos/sessions/TXN-20260608-135007-FA3F/dslr_1780901495205.jpg',1,'2026-06-08 13:51:35.206'),(144,57,'http://localhost:8080/photos/sessions/TXN-20260608-135007-FA3F/dslr_1780901515619.jpg',2,'2026-06-08 13:51:55.621'),(145,57,'http://localhost:8080/photos/sessions/TXN-20260608-135007-FA3F/dslr_1780901536123.jpg',3,'2026-06-08 13:52:16.123'),(146,57,'http://localhost:8080/photos/sessions/TXN-20260608-135007-FA3F/dslr_1780901560170.jpg',4,'2026-06-08 13:52:40.171'),(147,57,'http://localhost:8080/photos/sessions/TXN-20260608-135007-FA3F/dslr_1780901595085.jpg',5,'2026-06-08 13:53:15.087'),(148,58,'http://localhost:8080/photos/sessions/TXN-20260608-140832-AFEA/dslr_1780902589292.jpg',1,'2026-06-08 14:09:49.294'),(149,58,'http://localhost:8080/photos/sessions/TXN-20260608-140832-AFEA/dslr_1780902671206.jpg',2,'2026-06-08 14:11:11.221'),(150,58,'http://localhost:8080/photos/sessions/TXN-20260608-140832-AFEA/dslr_1780902693713.jpg',3,'2026-06-08 14:11:33.717'),(151,58,'http://localhost:8080/photos/sessions/TXN-20260608-140832-AFEA/dslr_1780902714798.jpg',4,'2026-06-08 14:11:54.799'),(152,58,'http://localhost:8080/photos/sessions/TXN-20260608-140832-AFEA/dslr_1780902735197.jpg',5,'2026-06-08 14:12:15.198'),(153,60,'http://localhost:8080/photos/sessions/TXN-20260608-141605-B4DC/dslr_1780903061788.jpg',1,'2026-06-08 14:17:41.789'),(154,60,'http://localhost:8080/photos/sessions/TXN-20260608-141605-B4DC/dslr_1780903080810.jpg',2,'2026-06-08 14:18:00.825'),(155,60,'http://localhost:8080/photos/sessions/TXN-20260608-141605-B4DC/dslr_1780903106289.jpg',3,'2026-06-08 14:18:26.290'),(156,70,'http://localhost:8080/photos/sessions/TXN-20260609-140905-90DB/webcam_1780989007116191200.jpg',1,'2026-06-09 14:10:07.118'),(157,70,'http://localhost:8080/photos/sessions/TXN-20260609-140905-90DB/webcam_1780989016084357800.jpg',2,'2026-06-09 14:10:16.086'),(158,70,'http://localhost:8080/photos/sessions/TXN-20260609-140905-90DB/webcam_1780989025562959800.jpg',3,'2026-06-09 14:10:25.564'),(159,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780989092741437200.jpg',1,'2026-06-09 14:11:32.743'),(160,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780989100230633700.jpg',2,'2026-06-09 14:11:40.244'),(161,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780989107230370500.jpg',3,'2026-06-09 14:11:47.232'),(162,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780989121214687600.jpg',4,'2026-06-09 14:12:01.217'),(163,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780989129730961200.jpg',5,'2026-06-09 14:12:09.798'),(164,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780990377293228300.jpg',6,'2026-06-09 14:32:57.296'),(165,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780990384794252400.jpg',7,'2026-06-09 14:33:04.860'),(166,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780990393297339700.jpg',8,'2026-06-09 14:33:13.299'),(167,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780990401825862300.jpg',9,'2026-06-09 14:33:21.827'),(168,72,'http://localhost:8080/photos/sessions/TXN-20260609-141059-ACFF/webcam_1780990409821160700.jpg',10,'2026-06-09 14:33:29.823'),(169,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992136948577000.jpg',1,'2026-06-09 15:02:16.950'),(170,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992158946456500.jpg',2,'2026-06-09 15:02:38.952'),(171,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992167427422800.jpg',3,'2026-06-09 15:02:47.430'),(172,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992175421242400.jpg',4,'2026-06-09 15:02:55.423'),(173,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992187921977300.jpg',5,'2026-06-09 15:03:07.933'),(174,74,'http://localhost:8080/photos/sessions/TXN-20260609-150054-86C2/webcam_1780992197921542500.jpg',6,'2026-06-09 15:03:17.924'),(175,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780992653116581400.jpg',1,'2026-06-09 15:10:53.118'),(176,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780992665112652200.jpg',2,'2026-06-09 15:11:05.114'),(177,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780992676125134000.jpg',3,'2026-06-09 15:11:16.127'),(178,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780992683612986900.jpg',4,'2026-06-09 15:11:23.616'),(179,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780992695615470600.jpg',5,'2026-06-09 15:11:35.682'),(180,76,'https://picsum.photos/seed/1780992706095641400/1200/800',6,'2026-06-09 15:11:46.098'),(181,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780994054795178800.jpg',7,'2026-06-09 15:34:14.796'),(182,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780994061795405100.jpg',8,'2026-06-09 15:34:21.797'),(183,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780994330608725500.jpg',9,'2026-06-09 15:38:50.611'),(184,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780994343111231900.jpg',10,'2026-06-09 15:39:03.113'),(185,76,'http://localhost:8080/photos/sessions/TXN-20260609-151023-B740/webcam_1780994354118758700.jpg',11,'2026-06-09 15:39:14.134'),(186,82,'http://localhost:8080/photos/sessions/TXN-20260609-164929-7D04/dslr_1780998608972.jpg',1,'2026-06-09 16:50:08.973'),(187,82,'http://localhost:8080/photos/sessions/TXN-20260609-164929-7D04/dslr_1780998631015.jpg',2,'2026-06-09 16:50:31.016'),(188,84,'http://localhost:8080/photos/sessions/TXN-20260609-165106-6B81/dslr_1780998702114.jpg',1,'2026-06-09 16:51:42.116'),(189,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057235430577000.jpg',1,'2026-06-10 09:07:15.445'),(190,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057245919777200.jpg',2,'2026-06-10 09:07:25.936'),(191,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057253925328700.jpg',3,'2026-06-10 09:07:33.928'),(192,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057271531067400.jpg',4,'2026-06-10 09:07:51.546'),(193,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057281028993500.jpg',5,'2026-06-10 09:08:01.045'),(194,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057289525348200.jpg',6,'2026-06-10 09:08:09.527'),(195,86,'http://localhost:8080/photos/sessions/TXN-20260610-090406-941B/webcam_1781057302025447300.jpg',7,'2026-06-10 09:08:22.041'),(196,88,'http://localhost:8080/photos/sessions/TXN-20260610-140936-E860/webcam_1781075445579467000.jpg',1,'2026-06-10 14:10:45.581'),(197,88,'http://localhost:8080/photos/sessions/TXN-20260610-140936-E860/webcam_1781075455064220800.jpg',2,'2026-06-10 14:10:55.066'),(198,88,'http://localhost:8080/photos/sessions/TXN-20260610-140936-E860/webcam_1781075465067295900.jpg',3,'2026-06-10 14:11:05.069'),(199,88,'http://localhost:8080/photos/sessions/TXN-20260610-140936-E860/webcam_1781075476057282200.jpg',4,'2026-06-10 14:11:16.060'),(200,88,'http://localhost:8080/photos/sessions/TXN-20260610-140936-E860/webcam_1781075485570615300.jpg',5,'2026-06-10 14:11:25.582'),(201,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075644625048000.jpg',1,'2026-06-10 14:14:04.626'),(202,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075652625299000.jpg',2,'2026-06-10 14:14:12.627'),(203,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075660625619200.jpg',3,'2026-06-10 14:14:20.640'),(204,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075668621483200.jpg',4,'2026-06-10 14:14:28.624'),(205,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075675629760900.jpg',5,'2026-06-10 14:14:35.641'),(206,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075684122714100.jpg',6,'2026-06-10 14:14:44.124'),(207,90,'http://localhost:8080/photos/sessions/TXN-20260610-141327-1671/webcam_1781075692123164100.jpg',7,'2026-06-10 14:14:52.136'),(208,92,'http://localhost:8080/photos/sessions/TXN-20260610-151024-F5B8/webcam_1781079068928565500.jpg',1,'2026-06-10 15:11:08.930'),(209,92,'http://localhost:8080/photos/sessions/TXN-20260610-151024-F5B8/webcam_1781079080436828500.jpg',2,'2026-06-10 15:11:20.439'),(210,92,'http://localhost:8080/photos/sessions/TXN-20260610-151024-F5B8/webcam_1781079090426848900.jpg',3,'2026-06-10 15:11:30.450'),(211,92,'http://localhost:8080/photos/sessions/TXN-20260610-151024-F5B8/webcam_1781079098924563900.jpg',4,'2026-06-10 15:11:38.934'),(212,92,'http://localhost:8080/photos/sessions/TXN-20260610-151024-F5B8/webcam_1781079103940838800.jpg',5,'2026-06-10 15:11:43.949'),(213,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079200908837200.jpg',1,'2026-06-10 15:13:20.924'),(214,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079208406327000.jpg',2,'2026-06-10 15:13:28.407'),(215,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079216399142400.jpg',3,'2026-06-10 15:13:36.401'),(216,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079224400717000.jpg',4,'2026-06-10 15:13:44.402'),(217,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079231903867300.jpg',5,'2026-06-10 15:13:51.905'),(218,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079238895915500.jpg',6,'2026-06-10 15:13:58.897'),(219,94,'http://localhost:8080/photos/sessions/TXN-20260610-151246-33E6/webcam_1781079245912706600.jpg',7,'2026-06-10 15:14:05.915'),(220,96,'http://localhost:8080/photos/sessions/TXN-20260610-154739-F253/webcam_1781081318758573200.jpg',1,'2026-06-10 15:48:38.773'),(221,96,'http://localhost:8080/photos/sessions/TXN-20260610-154739-F253/webcam_1781081327765399400.jpg',2,'2026-06-10 15:48:47.766'),(222,96,'http://localhost:8080/photos/sessions/TXN-20260610-154739-F253/webcam_1781081337250375900.jpg',3,'2026-06-10 15:48:57.252'),(223,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081513779211000.jpg',1,'2026-06-10 15:51:53.782'),(224,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081521270585400.jpg',2,'2026-06-10 15:52:01.272'),(225,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081530270664800.jpg',3,'2026-06-10 15:52:10.285'),(226,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081537765591100.jpg',4,'2026-06-10 15:52:17.767'),(227,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081549761100900.jpg',5,'2026-06-10 15:52:29.770'),(228,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081557765861500.jpg',6,'2026-06-10 15:52:37.768'),(229,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081565272411800.jpg',7,'2026-06-10 15:52:45.289'),(230,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081598265411300.jpg',8,'2026-06-10 15:53:18.268'),(231,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081606769084700.jpg',9,'2026-06-10 15:53:26.770'),(232,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081615272258400.jpg',10,'2026-06-10 15:53:35.274'),(233,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081623766098900.jpg',11,'2026-06-10 15:53:43.781'),(234,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081630764733200.jpg',12,'2026-06-10 15:53:50.766'),(235,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081644781262400.jpg',13,'2026-06-10 15:54:04.783'),(236,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081653260011200.jpg',14,'2026-06-10 15:54:13.261'),(237,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081662302525300.jpg',15,'2026-06-10 15:54:22.318'),(238,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081707770761100.jpg',16,'2026-06-10 15:55:07.773'),(239,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081717764260900.jpg',17,'2026-06-10 15:55:17.766'),(240,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081725771623900.jpg',18,'2026-06-10 15:55:25.773'),(241,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081733767379400.jpg',19,'2026-06-10 15:55:33.780'),(242,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081742284118900.jpg',20,'2026-06-10 15:55:42.286'),(243,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081752771590600.jpg',21,'2026-06-10 15:55:52.773'),(244,98,'http://localhost:8080/photos/sessions/TXN-20260610-155107-8E63/webcam_1781081789775564800.jpg',22,'2026-06-10 15:56:29.777'),(245,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083698921.jpg',1,'2026-06-10 16:28:18.923'),(246,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083722896.jpg',2,'2026-06-10 16:28:42.911'),(247,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083744320.jpg',3,'2026-06-10 16:29:04.320'),(248,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083767804.jpg',4,'2026-06-10 16:29:27.805'),(249,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083791412.jpg',5,'2026-06-10 16:29:51.413'),(250,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083813818.jpg',6,'2026-06-10 16:30:13.837'),(251,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083835304.jpg',7,'2026-06-10 16:30:35.305'),(252,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083860324.jpg',8,'2026-06-10 16:31:00.325'),(253,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083881816.jpg',9,'2026-06-10 16:31:21.818'),(254,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083904823.jpg',10,'2026-06-10 16:31:44.838'),(255,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083926407.jpg',11,'2026-06-10 16:32:06.409'),(256,102,'http://localhost:8080/photos/sessions/TXN-20260610-162733-2B47/dslr_1781083956389.jpg',12,'2026-06-10 16:32:36.391'),(257,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094916338647500.jpg',1,'2026-06-10 19:35:16.339'),(258,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094924821166200.jpg',2,'2026-06-10 19:35:24.822'),(259,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094932319593500.jpg',3,'2026-06-10 19:35:32.334'),(260,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094940317650600.jpg',4,'2026-06-10 19:35:40.319'),(261,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094948319373700.jpg',5,'2026-06-10 19:35:48.329'),(262,110,'http://localhost:8080/photos/sessions/TXN-20260610-193438-237E/webcam_1781094956320618500.jpg',6,'2026-06-10 19:35:56.322'),(263,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095525525924900.jpg',1,'2026-06-10 19:45:25.527'),(264,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095534020646400.jpg',2,'2026-06-10 19:45:34.034'),(265,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095542512711300.jpg',3,'2026-06-10 19:45:42.514'),(266,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095550511384100.jpg',4,'2026-06-10 19:45:50.513'),(267,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095558022884900.jpg',5,'2026-06-10 19:45:58.033'),(268,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095564511433100.jpg',6,'2026-06-10 19:46:04.513'),(269,112,'http://localhost:8080/photos/sessions/TXN-20260610-194439-B852/webcam_1781095573001621400.jpg',7,'2026-06-10 19:46:13.003'),(270,120,'http://localhost:8080/photos/sessions/TXN-20260610-213417-45C5/webcam_1781102090967063100.jpg',1,'2026-06-10 21:34:50.968');
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(50) NOT NULL,
  `transaction_id` varchar(50) DEFAULT NULL,
  `package_id` bigint unsigned DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_transaction_id` (`transaction_id`),
  KEY `fk_sessions_package` (`package_id`),
  CONSTRAINT `fk_sessions_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `default_session_duration` bigint DEFAULT '300',
  `merchant_name` varchar(100) DEFAULT NULL,
  `merchant_id` varchar(50) DEFAULT NULL,
  `camera_resolution` varchar(50) DEFAULT '1920x1080 (FHD)',
  `countdown_timer` bigint DEFAULT '5',
  `booth_name` varchar(100) DEFAULT NULL,
  `booth_location` text,
  `booth_code` varchar(50) DEFAULT NULL,
  `admin_name` varchar(100) DEFAULT NULL,
  `admin_pin` varchar(4) DEFAULT NULL,
  `notification_email` varchar(100) DEFAULT NULL,
  `is_whatsapp_notif_on` tinyint(1) DEFAULT '1',
  `splash_text` varchar(255) DEFAULT NULL,
  `accent_color` varchar(20) DEFAULT NULL,
  `active_theme` varchar(50) DEFAULT 'Calm',
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` varchar(30) DEFAULT NULL,
  `layout_type` varchar(50) DEFAULT NULL,
  `theme` varchar(50) DEFAULT NULL,
  `is_custom_png` tinyint(1) DEFAULT '0',
  `frame_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `slot_count` bigint DEFAULT '4',
  `overlay_top` double DEFAULT '10',
  `overlay_left` double DEFAULT '10',
  `overlay_right` double DEFAULT '10',
  `overlay_bottom` double DEFAULT '10',
  `overlay_gap` double DEFAULT '4',
  `overlay_cols` bigint DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (9,'Pixel Minecraft','Pixel','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1780994195268081200.png',1,'2026-06-09 15:33:51.707','2026-06-10 11:30:14.488',6,3,3,3,8,0,2),(10,'Idul Fitri','EID CMYK','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781057776505953400.png',1,'2026-06-10 09:17:58.926','2026-06-10 14:17:03.231',6,3,5,6,5,3,2),(11,'Idul Fitri','EID','STRIP','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781062495313311900.png',1,'2026-06-10 10:35:21.639','2026-06-10 10:37:10.025',6,3,5,6,5,4,2),(12,'Imlek','Imlek CMYK','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781063683619383700.png',1,'2026-06-10 10:58:37.066','2026-06-10 10:58:37.066',6,2,4,4,10,2,2),(13,'Pixel Minecraft','Pixel Jamur','STRIP','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781064037395686400.png',1,'2026-06-10 11:01:32.553','2026-06-10 11:30:26.001',6,3,3,3,8,0,2),(14,'Retro','Retro CMYK','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781064408198161100.png',1,'2026-06-10 11:08:44.605','2026-06-10 11:08:44.605',6,2,3,2,5,2,2),(15,'17 Agustus','17 Agustus','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781064813647099700.png',1,'2026-06-10 11:18:17.942','2026-06-10 11:30:34.166',6,11,2,2,16,0,2),(16,'Easster','Easter','STRIP','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781066422621762900.png',1,'2026-06-10 11:41:05.392','2026-06-10 11:42:14.618',6,2,3,2,15,2,2),(17,'Christmast','Christmas','STRIP','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781068455262619900.png',1,'2026-06-10 12:15:31.019','2026-06-10 12:15:31.019',6,3,6,5,5,4,2),(18,'China','China Kotak','STRIP','Collage (4 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781069932395112500.png',1,'2026-06-10 12:39:55.388','2026-06-10 12:39:55.388',4,17,5,4,10,4,2),(20,'Valentine','Valentine','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781070182185973300.png',1,'2026-06-10 12:43:51.007','2026-06-10 12:43:51.007',6,12,3,3,13,4,2),(21,'New Year','New year','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781070260413839900.png',1,'2026-06-10 12:45:17.763','2026-06-10 12:45:17.763',6,2,3,3,4,4,2),(22,'New Year','New year 2','COLLAGE','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781070358749369900.png',1,'2026-06-10 12:47:10.906','2026-06-10 12:47:10.906',6,6,5,5,6,3,2),(23,'Chinaa','China Kotak 6 Strip','STRIP','Collage (6 foto)','Classic (Gold)',1,'http://localhost:8080/uploads/paket_1781082252964651500.png',1,'2026-06-10 16:04:53.924','2026-06-10 16:09:32.639',6,12,4,4,8,0,2);
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) NOT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `package_id` varchar(50) NOT NULL,
  `amount` bigint NOT NULL,
  `payment_type` varchar(30) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `voucher_code` varchar(50) DEFAULT NULL,
  `discount_amount` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_transactions_transaction_id` (`transaction_id`),
  KEY `idx_transactions_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,'TXN-20260521-202322-ABE8','GLAMBOT-1779369802','group',45000,'bank_transfer','success','2026-05-21 20:23:22.855','2026-05-21 20:24:05.243',NULL,0),(2,'TXN-20260521-205322-5C84','GLAMBOT-1779371602','solo',35000,'bank_transfer','success','2026-05-21 20:53:22.548','2026-05-21 20:53:37.107',NULL,0),(3,'TXN-20260521-232559-8777','GLAMBOT-1779380759','solo',35000,'bank_transfer','success','2026-05-21 23:25:59.348','2026-05-21 23:26:12.695',NULL,0),(4,'TXN-20260521-232659-B867','GLAMBOT-1779380819','solo',35000,'bank_transfer','success','2026-05-21 23:26:59.165','2026-05-21 23:27:10.758',NULL,0),(5,'TXN-20260521-232814-AA21','GLAMBOT-1779380894','group',45000,'bank_transfer','success','2026-05-21 23:28:14.233','2026-05-21 23:28:27.074',NULL,0),(6,'TXN-20260521-233353-7709','GLAMBOT-1779381233','group',45000,'bank_transfer','success','2026-05-21 23:33:53.583','2026-05-21 23:34:06.501',NULL,0),(7,'TXN-20260521-235704-5637','GLAMBOT-1779382624','group',45000,'bank_transfer','success','2026-05-21 23:57:04.123','2026-05-21 23:57:48.101',NULL,0),(8,'TXN-20260521-235822-F882','GLAMBOT-1779382702','solo',35000,'bank_transfer','success','2026-05-21 23:58:22.255','2026-05-21 23:58:32.265',NULL,0),(9,'TXN-20260522-001656-9FB2','GLAMBOT-1779383816','solo',35000,'bank_transfer','success','2026-05-22 00:16:56.895','2026-05-22 00:17:09.007',NULL,0),(10,'TXN-20260522-001857-837C','GLAMBOT-1779383937','solo',35000,'bank_transfer','success','2026-05-22 00:18:57.533','2026-05-22 00:19:08.902',NULL,0),(11,'TXN-20260522-084514-4DC7','GLAMBOT-1779414314','solo',35000,'qris','pending','2026-05-22 08:45:14.318','2026-05-22 08:45:14.318',NULL,0),(12,'TXN-20260522-084541-24A8','GLAMBOT-1779414341','group',45000,'bank_transfer','success','2026-05-22 08:45:41.024','2026-05-22 08:45:51.926',NULL,0),(13,'TXN-20260522-092249-B719','GLAMBOT-1779416569','group',45000,'qris','pending','2026-05-22 09:22:49.271','2026-05-22 09:22:49.271',NULL,0),(14,'TXN-20260522-095205-6093','GLAMBOT-1779418325','solo',15000,'bank_transfer','success','2026-05-22 09:52:05.627','2026-05-22 09:52:26.444','GLAMBOTS2XL',20000),(15,'TXN-20260522-101624-89A6','GLAMBOT-1779419784','group',75000,'bank_transfer','success','2026-05-22 10:16:24.112','2026-05-22 10:17:06.688','',0),(16,'TXN-20260522-123114-F60F','GLAMBOT-1779427874','group',75000,'bank_transfer','success','2026-05-22 12:31:14.182','2026-05-22 12:31:29.793','',0),(17,'TXN-20260522-130415-2C1C','GLAMBOT-1779429855','group',75000,'bank_transfer','success','2026-05-22 13:04:15.747','2026-05-22 13:04:31.751','',0),(18,'TXN-20260522-133215-FDBA','GLAMBOT-1779431535','group',75000,'bank_transfer','success','2026-05-22 13:32:15.984','2026-05-22 13:32:39.364','',0),(19,'TXN-20260522-133427-19DF','GLAMBOT-1779431667','group',75000,'bank_transfer','success','2026-05-22 13:34:27.573','2026-05-22 13:34:43.074','',0),(20,'TXN-20260522-151536-9F33','GLAMBOT-1779437736','group',75000,'bank_transfer','success','2026-05-22 15:15:36.216','2026-05-22 15:15:56.133','',0),(21,'TXN-20260522-152032-DB32','GLAMBOT-1779438032','group',75000,'qris','pending','2026-05-22 15:20:32.437','2026-05-22 15:20:32.437','',0),(22,'TXN-20260522-152128-1AE1','GLAMBOT-FREE-1779438088','solo',0,'voucher','success','2026-05-22 15:21:28.702','2026-05-22 15:21:28.702','GLAMBOT93XQ',55000),(23,'TXN-20260522-153243-5223','GLAMBOT-1779438763','group',75000,'bank_transfer','success','2026-05-22 15:32:43.469','2026-05-22 15:33:03.209','',0),(24,'TXN-20260522-160858-3D0B','GLAMBOT-1779440938','group',75000,'bank_transfer','success','2026-05-22 16:08:58.238','2026-05-22 16:09:11.900','',0),(25,'TXN-20260522-165355-FE42','GLAMBOT-1779443635','group',75000,'bank_transfer','success','2026-05-22 16:53:55.733','2026-05-22 16:54:10.159','',0),(26,'TXN-20260522-170055-256C','GLAMBOT-1779444055','group',75000,'bank_transfer','success','2026-05-22 17:00:55.664','2026-05-22 17:01:16.176','',0),(27,'TXN-20260525-202917-BFFF','GLAMBOT-1779715757','group',75000,'bank_transfer','success','2026-05-25 20:29:17.922','2026-05-25 20:29:40.642','',0),(28,'TXN-20260525-212643-E79A','GLAMBOT-1779719203','group',75000,'bank_transfer','success','2026-05-25 21:26:43.090','2026-05-25 21:26:55.433','',0),(29,'TXN-20260525-215538-065E','GLAMBOT-1779720938','group',75000,'bank_transfer','success','2026-05-25 21:55:38.511','2026-05-25 21:55:55.591','',0),(30,'TXN-20260525-222507-C7B4','GLAMBOT-1779722707','solo',55000,'bank_transfer','success','2026-05-25 22:25:07.586','2026-05-25 22:25:19.749','',0),(31,'TXN-20260525-231602-8315','GLAMBOT-1779725762','solo',55000,'bank_transfer','success','2026-05-25 23:16:02.292','2026-05-25 23:16:14.830','',0),(32,'TXN-20260526-080600-2483','GLAMBOT-1779757560','group',75000,'bank_transfer','success','2026-05-26 08:06:00.572','2026-05-26 08:06:12.574','',0),(33,'TXN-20260526-091256-324B','GLAMBOT-1779761576','solo',55000,'bank_transfer','success','2026-05-26 09:12:56.185','2026-05-26 09:13:09.884','',0),(34,'TXN-20260526-091553-28A5','GLAMBOT-1779761753','solo',55000,'bank_transfer','success','2026-05-26 09:15:53.570','2026-05-26 09:16:06.574','',0),(35,'TXN-20260526-092954-D7B5','GLAMBOT-1779762594','solo',55000,'bank_transfer','success','2026-05-26 09:29:54.363','2026-05-26 09:30:07.797','',0),(36,'TXN-20260526-093632-FBC0','GLAMBOT-1779762992','solo',55000,'bank_transfer','success','2026-05-26 09:36:32.200','2026-05-26 09:36:44.448','',0),(37,'TXN-20260526-095613-0D86','GLAMBOT-1779764173','solo',55000,'bank_transfer','success','2026-05-26 09:56:13.733','2026-05-26 09:56:25.500','',0),(38,'TXN-20260608-135007-FA3F','GLAMBOT-1780901407','solo',55000,'bank_transfer','success','2026-06-08 13:50:07.528','2026-06-08 13:50:30.036','',0),(39,'TXN-20260608-140832-AFEA','GLAMBOT-1780902512','solo',55000,'bank_transfer','success','2026-06-08 14:08:32.877','2026-06-08 14:08:52.489','',0),(40,'TXN-20260608-141605-B4DC','GLAMBOT-1780902965','solo',55000,'bank_transfer','success','2026-06-08 14:16:05.602','2026-06-08 14:16:21.066','',0),(41,'TXN-20260608-142050-14C9','GLAMBOT-1780903250','solo',55000,'bank_transfer','success','2026-06-08 14:20:50.886','2026-06-08 14:21:09.148','',0),(42,'TXN-20260609-134555-3D5C','GLAMBOT-1780987555','solo',55000,'qris','pending','2026-06-09 13:45:55.586','2026-06-09 13:45:55.586','',0),(43,'TXN-20260609-134708-568D','GLAMBOT-1780987628','solo',55000,'bank_transfer','success','2026-06-09 13:47:08.078','2026-06-09 13:47:26.227','',0),(44,'TXN-20260609-140026-9CB2','GLAMBOT-1780988426','solo',55000,'bank_transfer','success','2026-06-09 14:00:26.017','2026-06-09 14:00:40.773','',0),(45,'TXN-20260609-140102-7711','GLAMBOT-1780988462','solo',55000,'bank_transfer','success','2026-06-09 14:01:02.468','2026-06-09 14:01:16.211','',0),(46,'TXN-20260609-140716-EA42','GLAMBOT-1780988836','solo',55000,'bank_transfer','success','2026-06-09 14:07:16.621','2026-06-09 14:07:28.459','',0),(47,'TXN-20260609-140905-90DB','GLAMBOT-1780988945','solo',55000,'bank_transfer','success','2026-06-09 14:09:05.635','2026-06-09 14:09:17.037','',0),(48,'TXN-20260609-141059-ACFF','GLAMBOT-1780989059','group',75000,'bank_transfer','success','2026-06-09 14:10:59.593','2026-06-09 14:11:12.093','',0),(49,'TXN-20260609-150054-86C2','GLAMBOT-1780992054','group',75000,'bank_transfer','success','2026-06-09 15:00:54.644','2026-06-09 15:01:09.576','',0),(50,'TXN-20260609-151023-B740','GLAMBOT-1780992623','group',75000,'bank_transfer','success','2026-06-09 15:10:23.125','2026-06-09 15:10:35.447','',0),(51,'TXN-20260609-163542-5D42','GLAMBOT-1780997742','solo',55000,'bank_transfer','success','2026-06-09 16:35:42.866','2026-06-09 16:35:59.318','',0),(52,'TXN-20260609-164057-AD43','GLAMBOT-1780998057','solo',55000,'bank_transfer','success','2026-06-09 16:40:57.832','2026-06-09 16:41:11.123','',0),(53,'TXN-20260609-164929-7D04','GLAMBOT-1780998569','solo',55000,'bank_transfer','success','2026-06-09 16:49:29.693','2026-06-09 16:49:42.948','',0),(54,'TXN-20260609-165106-6B81','GLAMBOT-1780998666','solo',55000,'bank_transfer','success','2026-06-09 16:51:06.777','2026-06-09 16:51:18.126','',0),(55,'TXN-20260610-090406-941B','GLAMBOT-1781057046','group',75000,'bank_transfer','success','2026-06-10 09:04:06.343','2026-06-10 09:04:30.318','',0),(56,'TXN-20260610-140936-E860','GLAMBOT-1781075376','group',75000,'bank_transfer','success','2026-06-10 14:09:36.438','2026-06-10 14:09:56.471','',0),(57,'TXN-20260610-141327-1671','GLAMBOT-1781075607','group',75000,'bank_transfer','success','2026-06-10 14:13:27.719','2026-06-10 14:13:47.893','',0),(58,'TXN-20260610-151024-F5B8','GLAMBOT-1781079024','group',75000,'bank_transfer','success','2026-06-10 15:10:24.917','2026-06-10 15:10:39.774','',0),(59,'TXN-20260610-151246-33E6','GLAMBOT-1781079166','group',75000,'bank_transfer','success','2026-06-10 15:12:46.245','2026-06-10 15:13:01.155','',0),(60,'TXN-20260610-154739-F253','GLAMBOT-1781081259','group',75000,'bank_transfer','success','2026-06-10 15:47:39.530','2026-06-10 15:47:59.902','',0),(61,'TXN-20260610-155107-8E63','GLAMBOT-1781081467','duo',45000,'bank_transfer','success','2026-06-10 15:51:07.000','2026-06-10 15:51:33.429','',0),(62,'TXN-20260610-162556-6C8B','GLAMBOT-1781083556','duo',45000,'bank_transfer','success','2026-06-10 16:25:56.857','2026-06-10 16:26:10.598','',0),(63,'TXN-20260610-162733-2B47','GLAMBOT-1781083653','duo',45000,'bank_transfer','success','2026-06-10 16:27:33.743','2026-06-10 16:27:45.804','',0),(64,'TXN-20260610-170603-6F1C','GLAMBOT-1781085963','group',75000,'bank_transfer','success','2026-06-10 17:06:03.844','2026-06-10 17:06:15.250','',0),(65,'TXN-20260610-170739-E066','GLAMBOT-1781086059','group',75000,'bank_transfer','success','2026-06-10 17:07:39.001','2026-06-10 17:07:50.586','',0),(66,'TXN-20260610-171005-7444','GLAMBOT-1781086205','group',75000,'bank_transfer','success','2026-06-10 17:10:05.851','2026-06-10 17:10:21.056','',0),(67,'TXN-20260610-193438-237E','GLAMBOT-1781094878','group',75000,'bank_transfer','success','2026-06-10 19:34:38.613','2026-06-10 19:34:50.487','',0),(68,'TXN-20260610-194439-B852','GLAMBOT-1781095479','group',75000,'bank_transfer','success','2026-06-10 19:44:39.819','2026-06-10 19:45:08.092','',0),(69,'TXN-20260610-204650-CFAB','GLAMBOT-1781099210','group',75000,'qris','success','2026-06-10 20:46:50.473','2026-06-10 20:47:21.275','',0),(70,'TXN-20260610-204743-DFC2','GLAMBOT-1781099263','group',75000,'qris','pending','2026-06-10 20:47:43.759','2026-06-10 20:47:43.759','',0),(71,'TXN-20260610-205844-12DC','GLAMBOT-1781099924','group',75000,'qris','failed','2026-06-10 20:58:44.306','2026-06-10 20:58:44.587','',0),(72,'TXN-20260610-205931-9509','GLAMBOT-1781099971','group',75000,'qris','failed','2026-06-10 20:59:31.843','2026-06-10 20:59:32.089','',0),(73,'TXN-20260610-212142-6549','GLAMBOT-1781101302','group',75000,'qris','failed','2026-06-10 21:21:42.254','2026-06-10 21:21:42.533','',0),(74,'TXN-20260610-212207-5C18','GLAMBOT-1781101327','group',75000,'qris','failed','2026-06-10 21:22:07.510','2026-06-10 21:22:07.671','',0),(75,'TXN-20260610-212405-39C1','GLAMBOT-1781101445','group',75000,'gopay','failed','2026-06-10 21:24:05.312','2026-06-10 21:24:05.618','',0),(76,'TXN-20260610-213207-ABE3','GLAMBOT-1781101927','group',75000,'gopay','failed','2026-06-10 21:32:07.325','2026-06-10 21:32:07.527','',0),(77,'TXN-20260610-213225-5310','GLAMBOT-MOCK-1781101945','group',75000,'qris-mock','success','2026-06-10 21:32:25.596','2026-06-10 21:32:30.555','',0),(78,'TXN-20260610-213252-9F5D','GLAMBOT-MOCK-1781101972','group',75000,'qris-mock','success','2026-06-10 21:32:52.291','2026-06-10 21:32:57.190','',0),(79,'TXN-20260610-213417-45C5','GLAMBOT-1781102057','group',75000,'bank_transfer','success','2026-06-10 21:34:17.038','2026-06-10 21:34:32.060','',0);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_type` varchar(20) NOT NULL,
  `discount_value` bigint DEFAULT '0',
  `quota` bigint NOT NULL,
  `used` bigint DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `expired_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vouchers_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'GLAMBOTS2XL','nominal',20000,2,1,1,'2026-05-23 07:00:00.000','2026-05-22 09:51:42.637','2026-05-22 09:51:42.637'),(2,'GLAMBOT93XQ','percentage',100,1,1,1,'2026-05-30 07:00:00.000','2026-05-22 15:21:12.085','2026-05-22 15:21:12.085'),(3,'GLAMBOTNG5A','percentage',30,5,0,1,'2026-05-27 07:00:00.000','2026-05-22 17:04:55.510','2026-05-22 17:04:55.510');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-10 22:01:22
