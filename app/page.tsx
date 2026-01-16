"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  ChevronDown,
  Play,
  MapPin,
  Phone,
  Mail,
  X,
  Check,
} from "lucide-react";

// Social icon components (lucide deprecated the brand icons)
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const LuxuryRealEstatePage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const services = [
    {
      number: "01",
      title: "Оффис & Түрээслэгчийн удирдлага",
      subtitle: "Office Leasing",
      description:
        "Барилга, давхар, оффис бүрийн мэдээлэл, Одоогийн болон өмнөх төлбөрийн түүх",
    },
    {
      number: "02",
      title: "Сануулга & мэдэгдэл",
      subtitle: "Notifications",
      description: "Төлбөрийн хугацааны сануулга, Гэрээ дуусах мэдэгдэл",
    },
    {
      number: "03",
      title: "Гэрээний менежмент",
      subtitle: "Contract management",
      description:
        "Түрээсийн гэрээ бүртгэх, Гэрээний нөхцөл, өрөө тус бүрийн үнэ, хугацааг хянах",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      nameEn: "Жижиг",
      price: "20",
      period: "сар",
      description: "Цөөхөн өрөөтэй нэг барилгын удирдлага",
      features: [
        "1 барилга удирдах",
        "50 хүртэлх өрөө",
        "Төлбөрийн төрөл тохируулах",
        "Имэйл мэдэгдэл",
        "Үндсэн тайлан",
      ],
      highlighted: false,
      cta: "Эхлүүлэх",
    },
    {
      name: "Basic",
      nameEn: "Үндсэн",
      price: "50",
      period: "сар",
      description: "Дундаж барилгын удирдлага",
      features: [
        "1 барилга удирдах",
        "150 хүртэлх өрөө",
        "Төлбөрийн төрөл тохируулах",
        "Имэйл мэдэгдэл",
        "Үндсэн тайлан",
        "Давхрын зураг",
        "Гэрээний удирдлага",
        "Тоолуурын бүртгэл",
        "Хувьсах төлбөр",
      ],
      highlighted: false,
      cta: "Эхлүүлэх",
    },
    {
      name: "Pro",
      nameEn: "Мэргэжлийн",
      price: "100",
      period: "сар",
      description: "Олон барилгын удирдлага",
      features: [
        "3 барилга удирдах",
        "500 хүртэлх өрөө",
        "Төлбөрийн төрөл тохируулах",
        "Имэйл мэдэгдэл",
        "Үндсэн тайлан",
        "Давхрын зураг",
        "Гэрээний удирдлага",
        "Тоолуурын бүртгэл",
        "Хувьсах төлбөр",
        "Засвар үйлчилгээ удирдах",
        "Портал user удирдах",
        "SMS мэдэгдэл",
      ],
      highlighted: true,
      cta: "Хамгийн түгээмэл",
    },
    {
      name: "Enterprise",
      nameEn: "Байгууллага",
      price: "Захиалгаар",
      period: "",
      description: "Том компани, олон салбартай байгууллагуудад",
      features: [
        "Хязгааргүй барилга",
        "Хязгааргүй өрөө",
        "Бүх функц идэвхтэй",
        "API хандалт",
        "Тусгай дэмжлэг 24/7",
        "Өөрчлөн тохируулга",
        "Бусад",
      ],
      highlighted: false,
      cta: "Холбогдох",
    },
  ];

  const stats = [
    {
      value: "+73%",
      label: "Гар ажиллагааны",
      sublabel: "Үйл явцыг хурдасгана",
    },
    {
      value: "+60%",
      label: "Программ ашигладаг",
      sublabel: "Mенежерүүдийн үр ашиг",
    },
    { value: "-89%", label: "Бичиг баримт", sublabel: "Документын алдаа" },
    { value: "+20%", label: "Хугацаа хожих", sublabel: "Төлбөрийн түвшин" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-amber-500/30 selection:text-white">
      {/* Fixed Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-3 md:mx-6 my-3 md:my-4">
          <div
            className={`flex items-center justify-between px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-500 ${
              scrollY > 100
                ? "bg-black/80 backdrop-blur-xl border border-white/10"
                : "bg-transparent"
            }`}
          >
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-black relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg md:text-xl font-semibold tracking-tight">
                <span className="text-white">Property</span>
                <span className="text-amber-400">Hub</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              {[
                { label: "Бидний тухай", en: "About" },
                { label: "Үйлчилгээ", en: "Services" },
                { label: "Холбоо барих", en: "Contact" },
              ].map((item, i) => (
                <motion.a
                  key={item.label}
                  href={`#${item.en.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(item.en.toLowerCase())
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  className="relative text-sm font-medium text-white/70 hover:text-white transition-colors group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <motion.a
                href="tel:+97699909661"
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>9990-9661</span>
              </motion.a>
              <Link
                href="/login"
                className="relative group px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-medium rounded-lg md:rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-black font-semibold">
                  Нэвтрэх
                </span>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[200vh]">
        <motion.div
          style={{ scale: heroScale }}
          className="fixed inset-0 h-screen"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070')`,
            }}
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

          {/* Noise Texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity, y: textY }}
          className="fixed inset-0 h-screen flex items-center"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="max-w-4xl pt-16 md:pt-0">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="flex items-center gap-4 mb-4 md:mb-8"
              >
                <div className="w-12 md:w-16 h-px bg-gradient-to-r from-amber-400 to-transparent" />
                {/* <span className="text-amber-400 text-sm font-medium tracking-[0.3em] uppercase">
                  Premium Property Management
                </span> */}
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.5,
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 md:mb-8"
              >
                <span className="block text-white/90">Оффис түрээсийг</span>
                <span className="block mt-1 md:mt-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  системчилье
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-sm md:text-base text-white/60 max-w-xl mb-8 md:mb-12 leading-relaxed bg-gray-900 border rounded-xl md:rounded-2xl p-3 md:p-4"
              >
                Бүх үйл явцыг автоматжуулж, түрээслэгчидтэй харилцах, нэхэмжлэл
                үүсгэх, засварын хүсэлт шийдвэрлэхэд зориулсан нэгдсэн платформ.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
              >
                <Link
                  href="/experience"
                  className="group relative px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl overflow-hidden text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center gap-2 md:gap-3 text-black font-semibold text-sm md:text-base">
                    Туршиж үзэх
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                {/* ЭНД onClick НЭМСЭН! */}
                <button
                  onClick={() => setIsVideoOpen(true)}
                  className="group flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play className="w-3 h-3 md:w-4 md:h-4 ml-0.5" />
                  </div>
                  <span className="font-medium text-sm md:text-base">
                    Видео үзэх
                  </span>
                </button>
              </motion.div>

              {/* Video Modal - motion.div болгож өгье илүү smooth байхын тулд */}
              <AnimatePresence>
                {isVideoOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setIsVideoOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                      }}
                      className="relative w-full max-w-5xl aspect-video"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Хаах товч */}
                      <button
                        onClick={() => setIsVideoOpen(false)}
                        className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                      >
                        <X className="w-8 h-8" />
                      </button>

                      {/* Видео */}
                      <video
                        src="/videos/video.mp4"
                        controls
                        autoPlay
                        className="w-full h-full rounded-2xl shadow-2xl"
                      >
                        Таны browser видео дэмжихгүй байна.
                      </video>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            onClick={scrollToContent}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/50 hover:text-white transition-colors group"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.button>

          {/* Side Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="hidden xl:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col gap-8"
          >
            {stats.slice(0, 3).map((stat, i) => (
              <div key={i} className="text-right">
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Content Section */}
      <section
        ref={contentRef}
        id="about"
        className="relative bg-[#0a0a0a] pt-20 md:pt-32 pb-12 md:pb-20"
      >
        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-4 sm:p-6 md:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center md:text-left group"
              >
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent group-hover:from-amber-400 group-hover:to-amber-600 transition-all duration-500">
                  {stat.value}
                </div>
                <div className="mt-1 md:mt-2">
                  <div className="text-xs sm:text-sm text-white/80">
                    {stat.label}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/40">
                    {stat.sublabel}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* About Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-16 md:mb-32">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] sm:aspect-[4/4] lg:aspect-[4/5] rounded-2xl md:rounded-3xl overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center transform hover:scale-105 transition-transform duration-700"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069')`,
                  }}
                />
              </div>
              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-4 md:-bottom-8 md:-right-8 p-3 sm:p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black max-w-[180px] sm:max-w-xs"
              >
                <div className="text-xl sm:text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                  ExpontMind
                </div>
                <div className="text-xs sm:text-sm font-medium opacity-80">
                  Нягтлан, IT Мэргэжилтнүүд
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-8 md:w-12 h-px bg-gradient-to-r from-amber-400 to-transparent" />
                <span className="text-amber-400 text-xs md:text-sm font-medium tracking-[0.2em] uppercase">
                  Бидний тухай
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight mb-4 md:mb-8">
                <span className="text-white">Таны бизнесийн</span>
                <span className="block text-amber-400">найдвартай түнш</span>
              </h2>

              <p className="text-sm md:text-lg text-white/60 leading-relaxed mb-6 md:mb-8">
                Бид орчин үеийн технологи, туршлагатай багийнхаа хүчээр үл
                хөдлөх хөрөнгийн удирдлагыг шинэ түвшинд гаргаж, таны цаг
                хугацаа, зардлыг хэмнэнэ. Манай платформ нь түрээслэгчид,
                ажилтнууд, эзэмшигч бүгдэд ойлгомжтой, хялбар ашиглагдахаар
                бүтээгдсэн.
              </p>

              <ul className="space-y-3 md:space-y-4 mb-6 md:mb-10">
                {[
                  "Бодит цагийн мэдээлэл, тайлан",
                  "Автомат нэхэмжлэл, төлбөр хүлээн авалт",
                  "24/7 засварын хүсэлт удирдлага",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 md:gap-4"
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400" />
                    </div>
                    <span className="text-sm md:text-base text-white/80">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <a
                href="https://www.expontmind.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 md:gap-3 text-amber-400 font-medium text-sm md:text-base hover:gap-4 md:hover:gap-5 transition-all duration-300"
              >
                <span>Дэлгэрэнгүй мэдээлэл</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Services Section */}
        <div
          id="services"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-16 md:mb-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-amber-400 text-xs md:text-sm font-medium tracking-[0.2em] uppercase">
                Үйлчилгээ
              </span>
              <div className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-amber-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">
              <span className="text-white">Бидний</span>
              <span className="text-amber-400"> үйлчилгээ</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                onMouseEnter={() => setActiveSection(i)}
                className={`group relative p-5 sm:p-6 md:p-8 pb-16 sm:pb-20 rounded-2xl md:rounded-3xl border transition-all duration-500 cursor-pointer ${
                  activeSection === i
                    ? "bg-gradient-to-br from-amber-400/10 to-transparent border-amber-400/30"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Number */}
                <div
                  className={`text-4xl sm:text-5xl md:text-7xl font-bold mb-3 md:mb-6 transition-colors duration-500 ${
                    activeSection === i ? "text-amber-400/30" : "text-white/5"
                  }`}
                >
                  {service.number}
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                  {service.title}
                </h3>
                <p className="text-xs md:text-sm text-amber-400/80 mb-2 md:mb-4">
                  {service.subtitle}
                </p>
                <p className="text-sm md:text-base text-white/50 leading-relaxed">
                  {service.description}
                </p>

                {/* Arrow */}
                <div
                  className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    activeSection === i
                      ? "bg-amber-400 text-black"
                      : "bg-white/5 text-white/40 group-hover:bg-white/10"
                  }`}
                >
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div
          id="pricing"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-16 md:mb-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-amber-400 text-xs md:text-sm font-medium tracking-[0.2em] uppercase">
                Үнийн санал
              </span>
              <div className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-amber-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">
              <span className="text-white">Таны бизнест тохирсон</span>
              <span className="text-amber-400"> багц</span>
            </h2>
            <p className="text-sm md:text-base text-white/50 mt-4 max-w-2xl mx-auto">
              Бизнесийнхээ хэмжээнд тохируулан сонгоорой. Хүссэн үедээ багцаа
              өөрчлөх боломжтой.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`relative p-5 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border transition-all duration-500 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-amber-400/50"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full text-xs font-semibold text-black">
                    Түгээмэл
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs md:text-sm text-amber-400/80">
                    {plan.nameEn}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-4 md:mb-6">
                  {plan.price === "0" ? (
                    <div className="text-3xl md:text-4xl font-bold text-white">
                      Үнэгүй
                    </div>
                  ) : plan.price === "Захиалгаар" ? (
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      Захиалгаар
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-white">
                        ₮{plan.price}
                      </span>
                      <span className="text-sm text-white/50">
                        /{plan.period}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs md:text-sm text-white/50 mb-4 md:mb-6 leading-relaxed">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-white/70"
                    >
                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href={plan.price === "Захиалгаар" ? "#contact" : `/register?plan=${plan.name.toLowerCase()}&price=${plan.price.replace(/,/g, '')}`}
                  className={`block w-full text-center py-3 md:py-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-500 hover:to-amber-700"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-20"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative text-center">
              <h2 className="text-xl sm:text-2xl md:text-5xl font-bold text-black mb-4 md:mb-6 leading-tight">
                Өнөөдрөөс эхэлж,
                <span className="block">бизнесээ хялбаршуулаарай</span>
              </h2>
              <p className="text-sm md:text-lg text-black/70 max-w-2xl mx-auto mb-6 md:mb-10">
                14 хоногийн үнэгүй туршилтаар бүх функцийг туршиж үзээрэй.
                Кредит карт шаардахгүй, баталгаажуулалт шаардахгүй.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                <Link
                  href="/experience"
                  className="group w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 bg-black text-white font-semibold rounded-xl md:rounded-2xl hover:bg-black/80 transition-colors flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                >
                  <span>Туршиж үзэх</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 border-2 border-black/20 text-black font-semibold rounded-xl md:rounded-2xl hover:bg-black/10 transition-colors text-sm md:text-base text-center"
                >
                  Холбоо барих
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer
          id="contact"
          className="border-t border-white/10 pt-12 md:pt-20 pb-8 md:pb-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12 mb-10 md:mb-16">
              {/* Brand */}
              <div>
                <Link
                  href="/"
                  className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-black" />
                  </div>
                  <span className="text-lg md:text-xl font-semibold">
                    <span className="text-white">Property</span>
                    <span className="text-amber-400">Hub</span>
                  </span>
                </Link>
                <p className="text-xs md:text-sm text-white/50 max-w-xs leading-relaxed mb-4 md:mb-6">
                  Монголын үл хөдлөх хөрөнгийн менежментийг дараагийн түвшинд
                  гаргах зорилготой.
                </p>
                <div className="flex items-center gap-3 md:gap-4">
                  {[FacebookIcon, InstagramIcon, LinkedinIcon].map(
                    (Icon, i) => (
                      <a
                        key={i}
                        href="#"
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4 md:mb-6 text-sm md:text-base">
                  Холбоо барих
                </h4>
                <ul className="flex flex-col gap-3 md:gap-5">
                  <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-white/50">
                    <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    developer@expontmind.com
                  </li>
                  <li className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-white/50">
                    <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    +976 9990 9661
                  </li>
                  <li className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-white/50">
                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Улаанбаатар хот,
                      <br />
                      Сүхбаатар дүүрэг, UBmart 306
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              <p className="text-xs md:text-sm text-white/40 text-center md:text-left">
                © 2025 PropertyHub. Бүх эрх хуулиар хамгаалагдсан.
              </p>
              <div className="flex items-center gap-4 md:gap-6">
                {["Нууцлалын бодлого", "Үйлчилгээний нөхцөл"].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-xs md:text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        {/* Scroll to Top */}
        <AnimatePresence>
          {scrollY > 500 && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-11 h-11 md:w-14 md:h-14 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/25 z-50"
            >
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
            </motion.button>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default LuxuryRealEstatePage;
