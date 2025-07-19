import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, LogIn, UserPlus, MapPin, Clock, Battery, Bell, MessageSquare, Power, Smartphone, Shield, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import LoadingOverlay from '../components/LoadingOverlay';
const features = [
    {
        title: 'Realtime Location Tracking',
        description: 'Track your assets with precision down to 2-meter accuracy anywhere in the world.',
        icon: <MapPin className="text-blue-500" size={24} />,
    },
    {
        title: 'History Playback',
        description: 'Access up to 1 year of historical location data with our comprehensive timeline view.',
        icon: <Clock className="text-green-500" size={24} />,
    },
    {
        title: 'Dual Power System',
        description: 'USB powered with battery backup ensuring continuous operation for up to 4 hours.',
        icon: <Battery className="text-yellow-500" size={24} />,
    },
    {
        title: 'Geofencing Alerts',
        description: 'Set up virtual boundaries and receive instant SMS alerts when they are crossed.',
        icon: <Bell className="text-red-500" size={24} />,
    },
    {
        title: 'SMS Support',
        description: 'Receive alerts and configure your device remotely via simple SMS commands.',
        icon: <MessageSquare className="text-purple-500" size={24} />,
    },
    {
        title: 'Power Status Alerts',
        description: 'Get notified immediately when your device turns on or off for complete awareness.',
        icon: <Power className="text-orange-500" size={24} />,
    },
    {
        title: 'Cross-Platform Support',
        description: 'Access your tracking data from any device with our web and mobile applications.',
        icon: <Smartphone className="text-indigo-500" size={24} />,
    },
    {
        title: 'Enterprise Security',
        description: 'Bank-level encryption and security protocols to protect your sensitive location data.',
        icon: <Shield className="text-teal-500" size={24} />,
    },
];

const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
    { value: "50,000+", label: "Active Users" },
    { value: "10M+", label: "Locations Tracked" }
];

const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Fleet Manager',
        content: 'Tracker-App has revolutionized how we manage our delivery fleet. The real-time tracking and geofencing features have improved our efficiency by 35%.',
        avatar: '/api/placeholder/48/48',
    },
    {
        name: 'Michael Chen',
        role: 'Small Business Owner',
        content: 'As someone with valuable equipment, the peace of mind Tracker-App provides is priceless. The battery backup feature saved me thousands when a theft attempt was made.',
        avatar: '/api/placeholder/48/48',
    },
    {
        name: 'Elena Rodriguez',
        role: 'Logistics Coordinator',
        content: "The historical data playback has been instrumental in optimizing our delivery routes. We've cut fuel costs by 22% in just three months.",
        avatar: '/api/placeholder/48/48',
    },
];

const pricingPlans = [
    {
        name: 'Basic',
        price: '$9.99',
        period: 'per month',
        features: ['Real-time tracking', '3-month history', 'Basic SMS alerts', 'Web dashboard access'],
        highlighted: false,
    },
    {
        name: 'Premium',
        price: '$19.99',
        period: 'per month',
        features: ['Everything in Basic', '1-year history', 'Advanced geofencing', 'API access', 'Priority support'],
        highlighted: true,
    },
    {
        name: 'Enterprise',
        price: 'Contact us',
        period: 'custom pricing',
        features: ['Everything in Premium', 'White-label option', 'Custom integration', 'Dedicated account manager'],
        highlighted: false,
    },
];

const FAQs = [
    {
        question: 'How accurate is the location tracking?',
        answer: 'Tracker-App provides industry-leading accuracy of approximately 2 meters in optimal conditions, using a combination of GPS, GLONASS, and cellular triangulation technologies.',
    },
    {
        question: "What happens if there's no cellular coverage?",
        answer: 'Tracker-App will store location data locally when outside cellular coverage and automatically sync when connection is restored, ensuring no tracking gaps.',
    },
    {
        question: 'How is my data protected?',
        answer: 'We employ end-to-end encryption, secure data centers, and follow strict data protection protocols that comply with global standards including GDPR and CCPA.',
    },
    {
        question: 'Can I share access with team members?',
        answer: 'Yes, our platform allows you to create multiple user accounts with customizable permission levels for your team members.',
    },
];

export default function LandingPage() {
    const [theme, setTheme] = useState('dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const testimonialsRef = useRef(null);
    const pricingRef = useRef(null);
    const faqRef = useRef(null);

    const [videoLoaded, setVideoLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const videoRef = useRef(null);

    // Refs for intersection observer
    const statsRef = useRef(null);
    const featureCardsRef = useRef(null);
    const testimonialCardsRef = useRef(null);

    // State for animation triggers
    const [statsVisible, setStatsVisible] = useState(false);
    const [featuresVisible, setFeaturesVisible] = useState(false);
    const [testimonialsVisible, setTestimonialsVisible] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setStatsVisible(true);
                statsObserver.unobserve(entries[0].target);
            }
        }, observerOptions);

        const featuresObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setFeaturesVisible(true);
                featuresObserver.unobserve(entries[0].target);
            }
        }, observerOptions);

        const testimonialsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setTestimonialsVisible(true);
                testimonialsObserver.unobserve(entries[0].target);
            }
        }, observerOptions);

        if (statsRef.current) statsObserver.observe(statsRef.current);
        if (featureCardsRef.current) featuresObserver.observe(featureCardsRef.current);
        if (testimonialCardsRef.current) testimonialsObserver.observe(testimonialCardsRef.current);

        return () => {
            if (statsRef.current) statsObserver.unobserve(statsRef.current);
            if (featureCardsRef.current) featuresObserver.unobserve(featureCardsRef.current);
            if (testimonialCardsRef.current) testimonialsObserver.unobserve(testimonialCardsRef.current);
        };
    }, []);

    const scrollToSection = (ref) => {
        ref.current.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const checkProgress = () => {
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                const duration = video.duration || 1;
                const percent = (bufferedEnd / duration) * 100;
                setLoadingProgress(percent.toFixed(2));
                if (percent >= 100 || video.readyState === 4) {
                    setVideoLoaded(true);
                    clearInterval(interval);
                }
            }
        };

        const interval = setInterval(checkProgress, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (videoLoaded && video) video.play().catch(() => { });
    }, [videoLoaded]);


    return (
        <div className="min-h-screen font-sans transition-colors duration-300 bg-gradient-to-br from-[#111827] via-black to-[#10151b] text-white">
            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-[rgba(20,20,25,0.7)] backdrop-blur-md border-b border-gray-800 shadow-lg shadow-purple-500/10`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                                    Tracker-App
                                </h1>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block">
                            <div className="flex items-center space-x-4">
                                <button onClick={() => scrollToSection(heroRef)} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-500/10 transition-colors">
                                    Home
                                </button>
                                <button onClick={() => scrollToSection(featuresRef)} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-500/10 transition-colors">
                                    Features
                                </button>
                                <button onClick={() => scrollToSection(testimonialsRef)} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-500/10 transition-colors">
                                    Testimonials
                                </button>
                                <button onClick={() => scrollToSection(pricingRef)} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-500/10 transition-colors">
                                    Pricing
                                </button>
                                <button onClick={() => scrollToSection(faqRef)} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-500/10 transition-colors">
                                    FAQ
                                </button>
                            </div>
                        </div>

                        {/* Call-to-action buttons */}
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <Link to='/register' className="hidden md:flex items-center gap-1 px-3 py-1 text-sm md:px-4 md:py-2 rounded-md border border-transparent hover:bg-purple-500/10 transition-colors">
                                <UserPlus size={16} className="mr-1" /> Sign Up
                            </Link>
                            <Link
                                to="/login"
                                aria-label="Login"
                                className="
                                        hidden md:inline-flex items-center space-x-2
                                        px-4 py-2 text-sm font-medium rounded-lg
                                        bg-gradient-to-r from-blue-500 via-purple-600 to-purple-500
                                        hover:from-purple-500 hover:via-purple-600 hover:to-blue-500
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
                                        transition-colors duration-300 ease-in-out
                                "
                            >
                                <LogIn className="h-4 w-4" aria-hidden="true" />
                                <span>Login</span>
                            </Link>
                            <button
                                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 rounded-md hover:bg-purple-500/10 transition-colors"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open menu</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-[rgba(30,30,30,0.9)] backdrop-blur-md border-t border-gray-800">
                            <button onClick={() => scrollToSection(heroRef)} className="block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                Home
                            </button>
                            <button onClick={() => scrollToSection(featuresRef)} className="block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                Features
                            </button>
                            <button onClick={() => scrollToSection(testimonialsRef)} className="block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                Testimonials
                            </button>
                            <button onClick={() => scrollToSection(pricingRef)} className="block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                Pricing
                            </button>
                            <button onClick={() => scrollToSection(faqRef)} className="block px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                FAQ
                            </button>
                            <Link to={"/register"} className="flex items-center gap-1 px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                <UserPlus size={16} className="mr-2" /> Sign Up
                            </Link>
                            <Link to={"/login"} className="flex items-center gap-1 px-3 py-2 rounded-md text-base font-medium w-full text-left hover:bg-purple-500/10 transition-colors">
                                <LogIn size={16} className="mr-2" /> Login
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {!videoLoaded && <LoadingOverlay />}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                    <video
                        ref={videoRef}
                        className={`object-cover w-full h-full transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        src="./TraceLink.mp4"
                        muted
                        preload="auto"
                        playsInline
                        onContextMenu={(e) => e.preventDefault()}
                    />
                    {/* <div className="absolute inset-0 bg-gradient-to-br from-[#111827]/70 via-black/70 to-[#10151b]/70 transition-opacity duration-500" /> */}
                </div>
            </section>

            <section
                ref={featuresRef}
                className="py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-gradient-to-br from-[#111827] via-black to-[#10151b]"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Powerful Features
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto opacity-80">
                            Cutting-edge technology that puts you in control of your assets with precision and reliability.
                        </p>
                    </div>

                    <div ref={featureCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={feature.title}
                                className={`p-6 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] ${featuresVisible ? 'animate-feature-card' : 'opacity-0'
                                    }`}
                                style={{
                                    animationDelay: `${idx * 0}s`,
                                }}
                            >
                                <div className="mb-4 text-purple-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-8 rounded-2xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                                    Advanced Tracking Technology
                                </h3>
                                <p className="mb-6 opacity-80">
                                    Our proprietary technology combines GPS, cellular, and WiFi positioning for unmatched accuracy in all environments.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Industry-leading 2-meter accuracy',
                                        'Low power consumption design',
                                        'Automatic switching between tracking modes',
                                        'Compact, discreet form factor'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start">
                                            <svg className="w-5 h-5 text-purple-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <button className="mt-8 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white rounded-md transition-all">
                                    Learn More
                                </button>
                            </div>
                            <div className="rounded-xl overflow-hidden bg-[rgba(20,20,25,0.7)] shadow-xl border border-gray-800">
                                <img
                                    src="./dark_dashboard.png"
                                    alt="Tracker-App device"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                ref={testimonialsRef}
                className="py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-gradient-to-br from-[#111827] via-black to-[#10151b]"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            What Our Customers Say
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto opacity-80">
                            Join thousands of satisfied users who trust Tracker-App for their tracking needs.
                        </p>
                    </div>

                    <div ref={testimonialCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, idx) => (
                            <div
                                key={testimonial.name}
                                className={`p-6 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] ${testimonialsVisible ? 'animate-testimonial-card' : 'opacity-0'
                                    }`}
                                style={{
                                    animationDelay: `${0 * idx}s`
                                }}
                            >
                                <div className="flex items-center mb-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full mr-4 border border-purple-500/30"
                                    />
                                    <div>
                                        <h4 className="font-semibold">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-400">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                </div>
                                <p className="italic text-gray-300">
                                    "{testimonial.content}"
                                </p>
                            </div>
                        ))}
                    </div>

                    <div ref={statsRef} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, idx) => {
                            const numeric = parseFloat(stat.value.replace(/[^\d.]/g, ""));
                            const suffix = stat.value.replace(/[\d.,0-9]/g, "");

                            return (
                                <div
                                    key={stat.label}
                                    className={`p-6 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] ${statsVisible ? 'animate-stat-card' : 'opacity-0'
                                        }`}
                                    style={{ animationDelay: `${idx * 0}s` }}
                                >
                                    {statsVisible && (
                                        <CountUp
                                            start={0}
                                            end={numeric}
                                            duration={2}
                                            separator=","
                                            suffix={suffix}
                                        >
                                            {({ countUpRef }) => (
                                                <p
                                                    ref={countUpRef}
                                                    className="text-3xl md:text-4xl font-bold text-purple-400"
                                                />
                                            )}
                                        </CountUp>
                                    )}
                                    <p className="mt-2 text-gray-400">
                                        {stat.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section
                ref={faqRef}
                className="py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-gradient-to-br from-[#111827] via-black to-[#10151b]"
            >
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto opacity-80">
                            Everything you need to know about Tracker-App tracking solutions.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FAQs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg overflow-hidden transition-shadow bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]"
                            >
                                <button
                                    className="flex justify-between items-center w-full p-4 text-left font-medium"
                                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                                >
                                    {faq.question}
                                    <ChevronDown
                                        size={20}
                                        className={`transition-transform duration-300 ${expandedFAQ === idx ? 'transform rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${expandedFAQ === idx ? 'max-h-40' : 'max-h-0'
                                        }`}
                                >
                                    <p className="p-4 pt-0 text-gray-400">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="mb-4">Still have questions?</p>
                        <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white rounded-md transition-all">
                            Contact Support
                        </button>
                    </div>
                </div>
            </section>

            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Start Tracking Today
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto mb-8">
                        Join thousands of satisfied customers and experience the power of Tracker-App tracking technology.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to={"/register"} className="px-8 py-3 rounded-md bg-white text-blue-900 hover:bg-blue-50 font-medium transition-all transform hover:scale-105 shadow-lg">
                            Get Started Now
                        </Link>
                        <button className="px-8 py-3 rounded-md border border-white hover:bg-white/10 text-white font-medium transition-all">
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0a0c10] text-gray-300">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Tracker-App</h3>
                            <p className="mb-4 opacity-80">
                                Advanced tracking solutions for businesses and individuals.
                            </p>
                            <div className="flex space-x-4">
                                {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        <span className="sr-only">{social}</span>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Our Products</h3>
                            <ul className="space-y-2">
                                {['Tracelink x1', 'Cubi View', 'Ornament Tracker', 'Personnel Tracker'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-purple-400 transition-colors">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-purple-400 transition-colors">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Support</h3>
                            <ul className="space-y-2">
                                {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-purple-400 transition-colors">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                        <p>&copy; {new Date().getFullYear()} CuBIT. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-stat-card {
          animation: fadeIn 0.8s ease forwards;
        }
        
        .animate-feature-card {
          animation: fadeInUp 0.8s ease forwards;
        }
        
        .animate-testimonial-card {
          animation: fadeInUp 0.8s ease forwards;
        }
      `}</style>
        </div>
    );
}