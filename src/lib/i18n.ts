export type Lang = 'en' | 'bn';

export const translations = {
  en: {
    // Header / Nav
    home: 'Home',
    menu: 'Menu',
    trackOrder: 'Track Order',
    admin: 'Admin',
    cart: 'Cart',

    // Hero
    premiumQuality: 'Premium Quality Food',
    cravingTitle: 'Craving Something',
    cravingHighlight: 'Hot & Spicy?',
    heroSubtitle: 'Order Chilli Chicken, Chowmein, Fried Rice and more — delivered hot and fresh to your doorstep.',
    orderNow: 'Order Now',
    freeDelivery: 'Free delivery on orders above ₹200',

    // Home page
    browseCategory: 'Browse by Category',
    allItems: 'All Items',
    popularItems: 'Popular Items',

    // Cart
    yourCart: 'Your Cart',
    cartEmpty: 'Your cart is empty',
    addItemsToCart: 'Add some delicious items to get started!',
    checkout: 'Checkout',
    remove: 'Remove',

    // Checkout
    checkoutTitle: 'Checkout',
    orderType: 'Order Type',
    homeDelivery: 'Home Delivery',
    dineInPickup: 'Dine-in / Pickup',
    name: 'Name',
    phone: 'Phone',
    gender: 'Gender',
    male: 'Male (Sir)',
    female: "Female (Ma'am)",
    deliveryAddress: 'Delivery Address',
    addressPlaceholder: 'House no, Street, Area...',
    captureLocation: 'Capture Live Location',
    detectingLocation: 'Detecting location...',
    locationCaptured: 'Location captured',
    locationRequired: 'Please capture your live GPS location to place a delivery order',
    locationRequiredHint: 'Live GPS location is required for home delivery',
    locationNotSupported: 'Your device does not support GPS location. Please use a device with location services.',
    locationCaptureFailed: 'Failed to capture your location. Please enable location permissions and try again.',
    locationTooFar: 'Your location is {dist} km away, which is beyond our {radius} km delivery range. Please order from closer to our branch.',
    deliveryInfo: 'We deliver within {radius} km of our branch at Naduria, Nadia (near Maa Tara Telecom). Capture your live location to check delivery availability.',
    storeClosedNotice: 'Home delivery is available between {open} and {close}. We are currently closed for delivery.',
    storeManuallyClosed: ' (Store manually closed by admin)',

    // Payment
    paymentMethod: 'Payment Method',
    cashOnDelivery: 'Cash on Delivery',
    onlineUpi: 'Online (UPI/QR)',
    onlineUnavailable: 'Online payment is currently unavailable. Please choose Cash on Delivery.',
    scanQr: 'Scan this QR code to pay',
    upiId: 'UPI ID',
    bankDetails: 'Bank Details',

    // Order summary
    subtotal: 'Subtotal',
    deliveryCharge: 'Delivery Charge',
    pickup: 'Pickup',
    free: 'Free',
    total: 'Total',
    yourOrder: 'Your Order',
    placingOrder: 'Placing Order...',
    enterAddressWarning: 'Please enter a delivery address to place your order',

    // Success
    congratulations: 'Congratulations!',
    orderPlacedSuccess: 'Your order has been placed successfully!',
    deliverySuccess: 'We will deliver it hot and fresh to your doorstep.',
    pickupSuccess: 'Your food will be ready for pickup shortly.',

    // Track page
    trackYourOrders: 'Track Your Orders',
    loading: 'Loading orders...',
    noOrders: 'No orders yet',
    placeOrderToTrack: 'Place an order to track it here.',
    orderDetails: 'Order Details',
    items: 'Items',
    eta: 'ETA: {min} min',
    liveDeliveryTracking: 'Live Delivery Tracking',
    restaurant: 'Restaurant',
    yourLocation: 'Your Location',
    liveLocation: 'Live Location',
    kmAway: '{km} km away',
    openInMaps: 'Open in Maps',
    giveFeedback: 'Give Feedback',

    // Status steps
    statusOrderPlaced: 'Order Placed',
    statusPreparing: 'Preparing',
    statusOutForDelivery: 'Out for Delivery',
    statusDelivered: 'Delivered',

    // Status badges
    statusPending: 'Pending',
    statusOnTheWay: 'On the way',
    statusCancelled: 'Cancelled',

    // Admin
    adminPanel: 'Admin Panel',
    enterPassword: 'Enter password to access',
    adminPassword: 'Admin password',
    login: 'Login',
    defaultPassword: 'Default password: Admin123',
    incorrectPassword: 'Incorrect password',
    adminDashboard: 'Admin Dashboard',
    logout: 'Logout',
    dashboard: 'Dashboard',
    voice: 'Voice',
    sms: 'SMS',
    delivery: 'Delivery',
    payment: 'Payment',
    offers: 'Offers',
    incomingOrders: 'Incoming Orders',
    noOrdersYet: 'No orders yet',
    viewLocationMap: 'View Location on Map',
    navigateMaps: 'Navigate / Open in Google Maps',
    deliveryAndStoreHours: 'Delivery & Store Hours',
    storeStatus: 'Store Status',
    storeStatusHint: 'Manually close the store to block all deliveries',
    open: 'Open',
    closed: 'Closed',
    deliveryRadius: 'Delivery Radius (km)',
    baseDeliveryCharge: 'Base Delivery Charge (₹)',
    perKmCharge: 'Per km Charge (₹)',
    minOrderAmount: 'Minimum Order Amount (₹)',
    branchLatitude: 'Branch Latitude (Naduria)',
    branchLongitude: 'Branch Longitude (Naduria)',
    storeOpenTime: 'Store Open Time (24h, e.g. 17:00)',
    storeCloseTime: 'Store Close Time (24h, e.g. 22:00)',
    storeAddress: 'Store Address',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    paymentSettings: 'Payment Settings',
    onlinePaymentUpi: 'Online Payment (UPI/QR)',
    enableOnlineHint: 'Enable to accept online payments at checkout',
    enabled: 'Enabled',
    disabled: 'Disabled',
    upiIdLabel: 'UPI ID',
    qrCodeUrl: 'QR Code Image URL',
    qrCodeHint: 'Paste a direct image URL of your QR code. It will be shown to customers during online checkout.',
    bankDetailsOptional: 'Bank Details (optional)',
    savePaymentSettings: 'Save Payment Settings',
    onlineDisabledNotice: 'Online payment is disabled. Customers can only use Cash on Delivery.',
    footerTagline: 'Fast Food Delivery · Hot & Fresh · Delivered with love',

    // WhatsApp
    ownerWhatsappNumber: 'Owner WhatsApp Number',
    ownerWhatsappHint: 'Enter your WhatsApp number with country code (e.g. +91XXXXXXXXXX). New orders will be sent here.',
    orderSentToWhatsapp: 'Order details sent to owner WhatsApp',

    // Emoji feedback
    feedbackTitle: 'How was your order?',
    feedbackSubtitle: 'How was your experience?',
    feedbackTellMore: 'Tell us more (optional)',
    feedbackPlaceholder: 'Share your experience...',
    feedbackSubmit: 'Submit Feedback',
    feedbackSubmitting: 'Submitting...',
    feedbackThankYou: 'Thank you for your feedback!',
    feedbackSorry: "We're so sorry",
    feedbackSorryDesc: "We'll do better next time. Thank you for telling us.",
    emojiGreat: 'Great',
    emojiGood: 'Good',
    emojiOkay: 'Okay',
    emojiBad: 'Bad',
    emojiVeryBad: 'Very Bad',

    // Admin emoji feedback voice manager
    emojiFeedbackManager: 'Emoji Feedback Voice Manager',
    emojiFeedbackHint: 'Customize the voice response spoken when a customer selects each emoji rating.',
    rating1Label: '1-Star / Angry',
    rating2Label: '2-Star / Bad',
    rating3Label: '3-Star / Neutral',
    rating4Label: '4-Star / Good',
    rating5Label: '5-Star / Love',

    // Admin greeting language
    greetingLanguage: 'Greeting Language',
    greetingLanguageHint: 'Choose the language for the app-opening voice greeting',
    greetingEnglish: 'English',
    greetingBengali: 'Bengali',
    greetingHindi: 'Hindi',
    englishGreeting: 'English Greeting Template',
    bengaliGreeting: 'Bengali Greeting Template',
    hindiGreeting: 'Hindi Greeting Template',
    voiceLanguageAdmin: 'Admin Voice Language',
    voiceLanguageAdminHint: 'Controls the TTS voice language for ALL customers, independent of their UI language',
    apologyTemplate: 'Apology Message',
    loyaltyTemplate: 'Loyalty Reward Message',

    // Admin analytics
    analytics: 'Analytics',
    totalRegisteredUsers: 'Total Registered Users',
    liveActiveUsers: 'Live Active Users',
    registeredUsersList: 'Registered Users',
    noRegisteredUsers: 'No registered users yet',
    phoneVerified: 'Phone Verified',

    // Checkout errors
    errNamePhone: 'Please enter your name and phone number',
    errAddress: 'Please enter your delivery address',
    errMinOrder: 'Minimum order amount is {amount}',
    errDeliveryHours: 'Home delivery is available between {open} and {close}. Please try again during our delivery hours.',
    errOnlineUnavailable: 'Online payment is currently unavailable. Please choose Cash on Delivery.',
    errOrderFailed: 'Failed to place order. Please try again.',

    // Admin dashboard
    totalOrders: 'Total Orders',
    revenue: 'Revenue',
    pendingLabel: 'Pending',
    menuItems: 'Menu Items',
    recentOrders: 'Recent Orders',

    // Admin menu tab
    menuManagement: 'Menu Management',
    addItem: 'Add Item',
    editItem: 'Edit Item',
    newItem: 'New Item',
    available: 'Available',
    unavailable: 'Unavailable',
    save: 'Save',
    deleteItemConfirm: 'Delete this menu item?',
    halfPrice: 'Half Price',
    fullPrice: 'Full Price',

    // Admin voice tab
    voiceGreetingSettings: 'Voice & Greeting Settings',
    welcomeGreeting: 'Welcome Greeting (on app open)',
    welcomeGreetingHint: 'Use [NAME] for customer name, [TITLE] for Sir/Ma\'am',
    malePrefix: 'Male Prefix (e.g. Sir)',
    femalePrefix: 'Female Prefix (e.g. Ma\'am)',
    apologyMessage: 'Apology Message (on negative feedback)',
    loyaltyRewardMessage: 'Loyalty Reward Message',

    // Admin SMS tab
    reOrderSmsTemplates: 'Re-order SMS Templates',
    smsTemplate: 'SMS Template',
    smsTemplateHint: 'Use {name} for customer name, {item} for item name',
    saveTemplate: 'Save Template',
    scheduledReminders: 'Scheduled Reminders',
    noReminders: 'No reminders scheduled',

    // Admin delivery tab
    deliveryFeeSlabs: 'Delivery Fee Slabs (Distance-based)',
    slabHint: 'Example: ₹20 up to 2 km, ₹40 up to 5 km, ₹60 up to 8 km.',
    slabLabelPlaceholder: 'Slab {num} label',
    slabMaxKmPlaceholder: 'Max km',
    slabChargePlaceholder: 'Charge ₹',
    branchLocationInfo: 'Branch Location: Naduria, Nadia District, West Bengal (PIN 741121). Landmark: Maa Tara Telecom. Default coordinates: 23.3118°N, 88.5338°E.',

    // Admin offers tab
    offersPromotions: 'Offers & Promotions',
    addOffer: 'Add Offer',
    offerTitle: 'Offer title',
    description: 'Description',
    imageUrl: 'Image URL',
    discountPercent: 'Discount %',
    createOffer: 'Create Offer',
    active: 'Active',
    inactive: 'Inactive',
    deleteOfferConfirm: 'Delete this offer?',

    // Status button labels (admin)
    statusPreparingLabel: 'Preparing',
    statusOutForDeliveryLabel: 'Out for delivery',
    statusDeliveredLabel: 'Delivered',
    statusCancelledLabel: 'Cancelled',

    // Cancel order
    cancelOrder: 'Cancel Order',
    cancelOrderTitle: 'Cancel This Order?',
    cancelOrderDesc: 'Are you sure you want to cancel this order? This action cannot be undone.',
    cancelReason: 'Reason for cancellation (optional)',
    cancelReasonPlaceholder: 'Select a reason...',
    cancelReasonChangedMind: 'Changed my mind',
    cancelReasonWrongItem: 'Ordered wrong item',
    cancelReasonDelay: 'Delay in delivery',
    cancelReasonOther: 'Other',
    cancelReasonOtherPlaceholder: 'Tell us why...',
    confirmCancel: 'Yes, Cancel Order',
    keepOrder: 'Keep Order',
    orderCancelled: 'Order cancelled successfully',
    cancellationFailed: 'Failed to cancel order. Please try again.',
    cancelling: 'Cancelling...',
    orderCancelledMsg: 'Your order has been cancelled.',
  },

  bn: {
    // Header / Nav
    home: 'হোম',
    menu: 'মেনু',
    trackOrder: 'অর্ডার ট্র্যাক করুন',
    admin: 'অ্যাডমিন',
    cart: 'কার্ট',

    // Hero
    premiumQuality: 'প্রিমিয়াম মানের খাবার',
    cravingTitle: 'তৃষ্ণা পিয়েছে',
    cravingHighlight: 'গরম ও ঝাল?',
    heroSubtitle: 'চিলি চিকেন, চাওমিন, ফ্রাইড রাইস এবং আরও — গরম ও তাজা আপনার দরজায় পৌঁছে যাবে।',
    orderNow: 'এখনই অর্ডার করুন',
    freeDelivery: '২০০ টাকার উপরে ফ্রি হোম ডেলিভারি',

    // Home page
    browseCategory: 'ক্যাটাগরি অনুযায়ী ব্রাউজ করুন',
    allItems: 'সব আইটেম',
    popularItems: 'জনপ্রিয় আইটেম',

    // Cart
    yourCart: 'আপনার কার্ট',
    cartEmpty: 'আপনার কার্ট খালি',
    addItemsToCart: 'শুরু করতে কিছু সুস্বাদু আইটেম যোগ করুন!',
    checkout: 'চেকআউট',
    remove: 'সরান',

    // Checkout
    checkoutTitle: 'চেকআউট',
    orderType: 'অর্ডারের ধরন',
    homeDelivery: 'হোম ডেলিভারি',
    dineInPickup: 'ডাইন-ইন / পিকআপ',
    name: 'নাম',
    phone: 'ফোন',
    gender: 'লিঙ্গ',
    male: 'পুরুষ (স্যার)',
    female: 'মহিলা (ম্যাম)',
    deliveryAddress: 'ডেলিভারি ঠিকানা',
    addressPlaceholder: 'বাড়ি নম্বর, রাস্তা, এলাকা...',
    captureLocation: 'লাইভ লোকেশন ক্যাপচার করুন',
    detectingLocation: 'লোকেশন শনাক্ত করা হচ্ছে...',
    locationCaptured: 'লোকেশন ক্যাপচার হয়েছে',
    locationRequired: 'ডেলিভারি অর্ডার করতে অনুগ্রহ করে আপনার লাইভ GPS লোকেশন ক্যাপচার করুন',
    locationRequiredHint: 'হোম ডেলিভারির জন্য লাইভ GPS লোকেশন আবশ্যক',
    locationNotSupported: 'আপনার ডিভাইস GPS লোকেশন সমর্থন করে না। অনুগ্রহ করে লোকেশন সেবা সহ একটি ডিভাইস ব্যবহার করুন।',
    locationCaptureFailed: 'আপনার লোকেশন ক্যাপচার করতে ব্যর্থ। অনুগ্রহ করে লোকেশন অনুমতি চালু করে আবার চেষ্টা করুন।',
    locationTooFar: 'আপনার লোকেশন {dist} কিমি দূরে, যা আমাদের {radius} কিমি ডেলিভারি রেঞ্জের বাইরে। অনুগ্রহ করে আমাদের শাখার কাছ থেকে অর্ডার করুন।',
    deliveryInfo: 'আমরা আমাদের নদুরিয়া শাখার {radius} কিমি এর মধ্যে ডেলিভারি দিই (মা তারা টেলিকমের কাছে)। ডেলিভারি উপলব্ধতা যাচাই করতে আপনার লাইভ লোকেশন ক্যাপচার করুন।',
    storeClosedNotice: 'হোম ডেলিভারি {open} থেকে {close} পর্যন্ত উপলব্ধ। আমরা বর্তমানে ডেলিভারি বন্ধ আছে।',
    storeManuallyClosed: ' (অ্যাডমিন দ্বারা স্টোর ম্যানুয়ালি বন্ধ করা হয়েছে)',

    // Payment
    paymentMethod: 'পেমেন্ট পদ্ধতি',
    cashOnDelivery: 'ক্যাশ অন ডেলিভারি',
    onlineUpi: 'অনলাইন (UPI/QR)',
    onlineUnavailable: 'অনলাইন পেমেন্ট বর্তমানে উপলব্ধ নয়। অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।',
    scanQr: 'পেমেন্ট করতে এই QR কোড স্ক্যান করুন',
    upiId: 'UPI আইডি',
    bankDetails: 'ব্যাংকের বিবরণ',

    // Order summary
    subtotal: 'সাবটোটাল',
    deliveryCharge: 'ডেলিভারি চার্জ',
    pickup: 'পিকআপ',
    free: 'ফ্রি',
    total: 'মোট',
    yourOrder: 'আপনার অর্ডার',
    placingOrder: 'অর্ডার করা হচ্ছে...',
    enterAddressWarning: 'অর্ডার করতে অনুগ্রহ করে ডেলিভারি ঠিকানা লিখুন',

    // Success
    congratulations: 'অভিনন্দন!',
    orderPlacedSuccess: 'আপনার অর্ডার সফলভাবে স্থাপিত হয়েছে!',
    deliverySuccess: 'আমরা গরম ও তাজা খাবার আপনার দরজায় পৌঁছে দেব।',
    pickupSuccess: 'আপনার খাবার শীঘ্রই পিকআপের জন্য প্রস্তুত হবে।',

    // Track page
    trackYourOrders: 'আপনার অর্ডার ট্র্যাক করুন',
    loading: 'অর্ডার লোড হচ্ছে...',
    noOrders: 'এখনও কোনো অর্ডার নেই',
    placeOrderToTrack: 'ট্র্যাক করতে একটি অর্ডার করুন।',
    orderDetails: 'অর্ডারের বিবরণ',
    items: 'আইটেম',
    eta: 'ETA: {min} মিনিট',
    liveDeliveryTracking: 'লাইভ ডেলিভারি ট্র্যাকিং',
    restaurant: 'রেস্তোরাঁ',
    yourLocation: 'আপনার অবস্থান',
    liveLocation: 'লাইভ লোকেশন',
    kmAway: '{km} কিমি দূরে',
    openInMaps: 'ম্যাপে খুলুন',
    giveFeedback: 'ফিডব্যাক দিন',

    // Status steps
    statusOrderPlaced: 'অর্ডার স্থাপিত',
    statusPreparing: 'প্রস্তুত হচ্ছে',
    statusOutForDelivery: 'ডেলিভারির পথে',
    statusDelivered: 'ডেলিভারি সম্পন্ন',

    // Status badges
    statusPending: 'বিচারাধীন',
    statusOnTheWay: 'পথে আছে',
    statusCancelled: 'বাতিল',

    // Admin
    adminPanel: 'অ্যাডমিন প্যানেল',
    enterPassword: 'অ্যাক্সেস করতে পাসওয়ার্ড লিখুন',
    adminPassword: 'অ্যাডমিন পাসওয়ার্ড',
    login: 'লগইন',
    defaultPassword: 'ডিফল্ট পাসওয়ার্ড: Admin123',
    incorrectPassword: 'ভুল পাসওয়ার্ড',
    adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    logout: 'লগআউট',
    dashboard: 'ড্যাশবোর্ড',
    voice: 'ভয়েস',
    sms: 'SMS',
    delivery: 'ডেলিভারি',
    payment: 'পেমেন্ট',
    offers: 'অফার',
    incomingOrders: 'আগত অর্ডার',
    noOrdersYet: 'এখনও কোনো অর্ডার নেই',
    viewLocationMap: 'ম্যাপে লোকেশন দেখুন',
    navigateMaps: 'নেভিগেট / গুগল ম্যাপসে খুলুন',
    deliveryAndStoreHours: 'ডেলিভারি ও স্টোর সময়',
    storeStatus: 'স্টোর স্ট্যাটাস',
    storeStatusHint: 'সব ডেলিভারি ব্লক করতে স্টোর ম্যানুয়ালি বন্ধ করুন',
    open: 'খোলা',
    closed: 'বন্ধ',
    deliveryRadius: 'ডেলিভারি ব্যাসার্ধ (কিমি)',
    baseDeliveryCharge: 'বেস ডেলিভারি চার্জ (₹)',
    perKmCharge: 'প্রতি কিমি চার্জ (₹)',
    minOrderAmount: 'ন্যূনতম অর্ডার পরিমাণ (₹)',
    branchLatitude: 'শাখার অক্ষাংশ (নদুরিয়া)',
    branchLongitude: 'শাখার দ্রাঘিমা (নদুরিয়া)',
    storeOpenTime: 'স্টোর খোলার সময় (২৪ঘ, যেমন 17:00)',
    storeCloseTime: 'স্টোর বন্ধের সময় (২৪ঘ, যেমন 22:00)',
    storeAddress: 'স্টোরের ঠিকানা',
    saveSettings: 'সেটিংস সংরক্ষণ করুন',
    saving: 'সংরক্ষণ হচ্ছে...',
    paymentSettings: 'পেমেন্ট সেটিংস',
    onlinePaymentUpi: 'অনলাইন পেমেন্ট (UPI/QR)',
    enableOnlineHint: 'চেকআউটে অনলাইন পেমেন্ট গ্রহণ করতে সক্ষম করুন',
    enabled: 'সক্ষম',
    disabled: 'অক্ষম',
    upiIdLabel: 'UPI আইডি',
    qrCodeUrl: 'QR কোড ছবির URL',
    qrCodeHint: 'আপনার QR কোডের সরাসরি ছবির URL পেস্ট করুন। এটি অনলাইন চেকআউটের সময় গ্রাহকদের দেখানো হবে।',
    bankDetailsOptional: 'ব্যাংকের বিবরণ (ঐচ্ছিক)',
    savePaymentSettings: 'পেমেন্ট সেটিংস সংরক্ষণ করুন',
    onlineDisabledNotice: 'অনলাইন পেমেন্ট অক্ষম। গ্রাহকরা শুধুমাত্র ক্যাশ অন ডেলিভারি ব্যবহার করতে পারবেন।',
    footerTagline: 'ফাস্ট ফুড ডেলিভারি · গরম ও তাজা · ভালোবাসায় পরিবেশিত',

    // WhatsApp
    ownerWhatsappNumber: 'মালিকের WhatsApp নম্বর',
    ownerWhatsappHint: 'আপনার WhatsApp নম্বর কান্ট্রি কোড সহ লিখুন (যেমন +91XXXXXXXXXX)। নতুন অর্ডার এখানে পাঠানো হবে।',
    orderSentToWhatsapp: 'অর্ডারের বিবরণ মালিকের WhatsApp-এ পাঠানো হয়েছে',

    // Emoji feedback
    feedbackTitle: 'আপনার অর্ডার কেমন ছিল?',
    feedbackSubtitle: 'আপনার অভিজ্ঞতা কেমন ছিল?',
    feedbackTellMore: 'আরও বলুন (ঐচ্ছিক)',
    feedbackPlaceholder: 'আপনার অভিজ্ঞতা শেয়ার করুন...',
    feedbackSubmit: 'ফিডব্যাক জমা দিন',
    feedbackSubmitting: 'জমা হচ্ছে...',
    feedbackThankYou: 'আপনার ফিডব্যাকের জন্য ধন্যবাদ!',
    feedbackSorry: 'আমরা দুঃখিত',
    feedbackSorryDesc: 'আমরা পরের বার আরও ভালো করব। জানানোর জন্য ধন্যবাদ।',
    emojiGreat: 'দারুণ',
    emojiGood: 'ভালো',
    emojiOkay: 'ঠিক ঠাক',
    emojiBad: 'খারাপ',
    emojiVeryBad: 'খুব খারাপ',

    // Admin emoji feedback voice manager
    emojiFeedbackManager: 'ইমোজি ফিডব্যাক ভয়েস ম্যানেজার',
    emojiFeedbackHint: 'প্রতিটি ইমোজি রেটিং নির্বাচনের সময় কোন ভয়েস রেসপন্স বাজবে তা কাস্টমাইজ করুন।',
    rating1Label: '১-তারা / রাগ',
    rating2Label: '২-তারা / খারাপ',
    rating3Label: '৩-তারা / নিরপেক্ষ',
    rating4Label: '৪-তারা / ভালো',
    rating5Label: '৫-তারা / ভালোবাসা',

    // Admin greeting language
    greetingLanguage: 'গ্রিটিং ভাষা',
    greetingLanguageHint: 'অ্যাপ খোলার ভয়েস গ্রিটিংয়ের ভাষা বেছে নিন',
    greetingEnglish: 'ইংরেজি',
    greetingBengali: 'বাংলা',
    greetingHindi: 'হিন্দি',
    englishGreeting: 'ইংরেজি গ্রিটিং টেমপ্লেট',
    bengaliGreeting: 'বাংলা গ্রিটিং টেমপ্লেট',
    hindiGreeting: 'হিন্দি গ্রিটিং টেমপ্লেট',
    voiceLanguageAdmin: 'অ্যাডমিন ভয়েস ভাষা',
    voiceLanguageAdminHint: 'সকল গ্রাহকের জন্য TTS ভয়েস ভাষা নিয়ন্ত্রণ করে, তাদের UI ভাষা থেকে স্বাধীন',
    apologyTemplate: 'ক্ষমা বার্তা',
    loyaltyTemplate: 'লয়্যালটি রিওয়ার্ড বার্তা',

    // Admin analytics
    analytics: 'অ্যানালিটিক্স',
    totalRegisteredUsers: 'মোট নিবন্ধিত ব্যবহারকারী',
    liveActiveUsers: 'লাইভ সক্রিয় ব্যবহারকারী',
    registeredUsersList: 'নিবন্ধিত ব্যবহারকারী',
    noRegisteredUsers: 'এখনও কোনো নিবন্ধিত ব্যবহারকারী নেই',
    phoneVerified: 'ফোন যাচাইকৃত',

    // Checkout errors
    errNamePhone: 'অনুগ্রহ করে আপনার নাম এবং ফোন নম্বর লিখুন',
    errAddress: 'অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা লিখুন',
    errMinOrder: 'ন্যূনতম অর্ডার পরিমাণ {amount}',
    errDeliveryHours: 'হোম ডেলিভারি {open} থেকে {close} পর্যন্ত উপলব্ধ। অনুগ্রহ করে আমাদের ডেলিভারি সময়ে আবার চেষ্টা করুন।',
    errOnlineUnavailable: 'অনলাইন পেমেন্ট বর্তমানে উপলব্ধ নয়। অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।',
    errOrderFailed: 'অর্ডার করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।',

    // Admin dashboard
    totalOrders: 'মোট অর্ডার',
    revenue: 'আয়',
    pendingLabel: 'বিচারাধীন',
    menuItems: 'মেনু আইটেম',
    recentOrders: 'সাম্প্রতিক অর্ডার',

    // Admin menu tab
    menuManagement: 'মেনু ব্যবস্থাপনা',
    addItem: 'আইটেম যোগ করুন',
    editItem: 'আইটেম সম্পাদনা',
    newItem: 'নতুন আইটেম',
    available: 'উপলব্ধ',
    unavailable: 'অনুপলব্ধ',
    save: 'সংরক্ষণ',
    deleteItemConfirm: 'এই মেনু আইটেমটি মুছবেন?',
    halfPrice: 'হাফ প্রাইস',
    fullPrice: 'ফুল প্রাইস',

    // Admin voice tab
    voiceGreetingSettings: 'ভয়েস ও গ্রিটিং সেটিংস',
    welcomeGreeting: 'ওয়েলকাম গ্রিটিং (অ্যাপ খোলার সময়)',
    welcomeGreetingHint: 'গ্রাহকের নামের জন্য [NAME], স্যার/ম্যামের জন্য [TITLE] ব্যবহার করুন',
    malePrefix: 'পুরুষ উপাধি (যেমন স্যার)',
    femalePrefix: 'মহিলা উপাধি (যেমন ম্যাম)',
    apologyMessage: 'ক্ষমা বার্তা (নেতিবাচক ফিডব্যাকে)',
    loyaltyRewardMessage: 'লয়্যালটি রিওয়ার্ড বার্তা',

    // Admin SMS tab
    reOrderSmsTemplates: 'রি-অর্ডার SMS টেমপ্লেট',
    smsTemplate: 'SMS টেমপ্লেট',
    smsTemplateHint: 'গ্রাহকের নামের জন্য {name}, আইটেমের নামের জন্য {item} ব্যবহার করুন',
    saveTemplate: 'টেমপ্লেট সংরক্ষণ',
    scheduledReminders: 'নির্ধারিত রিমাইন্ডার',
    noReminders: 'কোনো রিমাইন্ডার নির্ধারিত নেই',

    // Admin delivery tab
    deliveryFeeSlabs: 'ডেলিভারি ফি স্ল্যাব (দূরত্ব-ভিত্তিক)',
    slabHint: 'উদাহরণ: ২ কিমি পর্যন্ত ₹20, ৫ কিমি পর্যন্ত ₹40, ৮ কিমি পর্যন্ত ₹60।',
    slabLabelPlaceholder: 'স্ল্যাব {num} লেবেল',
    slabMaxKmPlaceholder: 'সর্বোচ্চ কিমি',
    slabChargePlaceholder: 'চার্জ ₹',
    branchLocationInfo: 'শাখার অবস্থান: নদুরিয়া, নদিয়া জেলা, পশ্চিমবঙ্গ (PIN 741121)। ল্যান্ডমার্ক: মা তারা টেলিকম। ডিফল্ট কোঅর্ডিনেট: 23.3118°N, 88.5338°E।',

    // Admin offers tab
    offersPromotions: 'অফার ও প্রমোশন',
    addOffer: 'অফার যোগ করুন',
    offerTitle: 'অফারের শিরোনাম',
    description: 'বিবরণ',
    imageUrl: 'ছবির URL',
    discountPercent: 'ছাড় %',
    createOffer: 'অফার তৈরি করুন',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    deleteOfferConfirm: 'এই অফারটি মুছবেন?',

    // Status button labels (admin)
    statusPreparingLabel: 'প্রস্তুত হচ্ছে',
    statusOutForDeliveryLabel: 'ডেলিভারির পথে',
    statusDeliveredLabel: 'ডেলিভারি সম্পন্ন',
    statusCancelledLabel: 'বাতিল',

    // Cancel order
    cancelOrder: 'অর্ডার বাতিল করুন',
    cancelOrderTitle: 'এই অর্ডারটি বাতিল করবেন?',
    cancelOrderDesc: 'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি বাতিল করতে চান? এটি ফেরানো যাবে না।',
    cancelReason: 'বাতিলের কারণ (ঐচ্ছিক)',
    cancelReasonPlaceholder: 'একটি কারণ নির্বাচন করুন...',
    cancelReasonChangedMind: 'মন পরিবর্তন করেছি',
    cancelReasonWrongItem: 'ভুল আইটেম অর্ডার করেছি',
    cancelReasonDelay: 'ডেলিভারিতে দেরি',
    cancelReasonOther: 'অন্যান্য',
    cancelReasonOtherPlaceholder: 'আপনার কারণ বলুন...',
    confirmCancel: 'হ্যাঁ, অর্ডার বাতিল করুন',
    keepOrder: 'অর্ডার রাখুন',
    orderCancelled: 'অর্ডার সফলভাবে বাতিল করা হয়েছে',
    cancellationFailed: 'অর্ডার বাতিল করতে ব্যর্থ। আবার চেষ্টা করুন।',
    cancelling: 'বাতিল করা হচ্ছে...',
    orderCancelledMsg: 'আপনার অর্ডার বাতিল করা হয়েছে।',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = translations[lang][key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
