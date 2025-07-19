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
