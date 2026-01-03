// lib/i18n/mn.ts
// Mongolian (Cyrillic) translations for PropertyHub

export const mn = {
  common: {
    // Actions
    save: 'Хадгалах',
    cancel: 'Цуцлах',
    delete: 'Устгах',
    edit: 'Засах',
    add: 'Нэмэх',
    create: 'Үүсгэх',
    update: 'Шинэчлэх',
    search: 'Хайх',
    filter: 'Шүүх',
    export: 'Экспортлох',
    import: 'Импортлох',
    download: 'Татах',
    upload: 'Байршуулах',
    view: 'Харах',
    close: 'Хаах',
    confirm: 'Баталгаажуулах',
    back: 'Буцах',
    next: 'Дараах',
    previous: 'Өмнөх',
    submit: 'Илгээх',
    reset: 'Шинэчлэх',
    clear: 'Цэвэрлэх',
    select: 'Сонгох',
    selectAll: 'Бүгдийг сонгох',
    deselectAll: 'Бүгдийг болих',

    // States
    loading: 'Ачааллаж байна...',
    saving: 'Хадгалж байна...',
    processing: 'Боловсруулж байна...',
    success: 'Амжилттай',
    error: 'Алдаа',
    warning: 'Анхааруулга',
    info: 'Мэдээлэл',

    // Confirmations
    confirmDelete: 'Устгахдаа итгэлтэй байна уу?',
    confirmCancel: 'Цуцлахдаа итгэлтэй байна уу?',
    unsavedChanges: 'Хадгалаагүй өөрчлөлтүүд байна',

    // Results
    noData: 'Мэдээлэл олдсонгүй',
    noResults: 'Үр дүн олдсонгүй',
    empty: 'Хоосон',

    // Date/Time
    today: 'Өнөөдөр',
    yesterday: 'Өчигдөр',
    tomorrow: 'Маргааш',
    thisWeek: 'Энэ долоо хоног',
    thisMonth: 'Энэ сар',
    thisYear: 'Энэ жил',

    // Others
    yes: 'Тийм',
    no: 'Үгүй',
    all: 'Бүгд',
    none: 'Байхгүй',
    other: 'Бусад',
    total: 'Нийт',
    subtotal: 'Дэд дүн',
  },

  auth: {
    // Login
    login: 'Нэвтрэх',
    logout: 'Гарах',
    register: 'Бүртгүүлэх',

    // Form
    email: 'Имэйл',
    password: 'Нууц үг',
    confirmPassword: 'Нууц үг давтах',
    phone: 'Утасны дугаар',
    rememberMe: 'Намайг сана',
    forgotPassword: 'Нууц үгээ мартсан?',

    // Tabs
    companyLogin: 'Компани',
    tenantLogin: 'Оршин суугч',
    adminLogin: 'Админ',

    // Messages
    loginSuccess: 'Амжилттай нэвтэрлээ',
    loginError: 'Нэвтрэхэд алдаа гарлаа',
    invalidCredentials: 'Имэйл эсвэл нууц үг буруу байна',
    invalidPhone: 'Утасны дугаар буруу байна',
    accountDisabled: 'Таны бүртгэл идэвхгүй болсон',

    // Password
    changePassword: 'Нууц үг солих',
    currentPassword: 'Одоогийн нууц үг',
    newPassword: 'Шинэ нууц үг',
    passwordChanged: 'Нууц үг амжилттай солигдлоо',
    passwordRequirements: 'Нууц үг дор хаяж 8 тэмдэгт байх ёстой',

    // Initial password
    initialPassword: 'Анхны нууц үг',
    pleaseChangePassword: 'Нууц үгээ солино уу',
  },

  nav: {
    dashboard: 'Хянах самбар',
    properties: 'Барилга байгууламж',
    units: 'Өрөө',
    tenants: 'Оршин суугчид',
    leases: 'Гэрээ',
    billings: 'Төлбөр нэхэмжлэх',
    payments: 'Төлбөр',
    meterReadings: 'Тоолуурын бүртгэл',
    maintenance: 'Засвар үйлчилгээ',
    reports: 'Тайлан',
    settings: 'Тохиргоо',
    notifications: 'Мэдэгдэл',
    help: 'Тусламж',

    // Tenant portal
    tenantPortal: 'Оршин суугчийн портал',
    myBillings: 'Миний төлбөрүүд',
    myUnit: 'Миний өрөө',
    submitMeter: 'Тоолуур бүртгэх',

    // Admin
    admin: 'Систем удирдлага',
    companies: 'Компаниуд',
    systemSettings: 'Системийн тохиргоо',
    auditLogs: 'Үйл ажиллагааны лог',
  },

  property: {
    // Titles
    title: 'Барилга байгууламж',
    list: 'Барилгын жагсаалт',
    detail: 'Барилгын дэлгэрэнгүй',
    create: 'Шинэ барилга нэмэх',
    edit: 'Барилга засах',

    // Fields
    name: 'Барилгын нэр',
    type: 'Төрөл',
    address: 'Хаяг',
    description: 'Тайлбар',
    totalFloors: 'Нийт давхар',

    // Types
    types: {
      apartment: 'Орон сууц',
      office: 'Оффис',
    },

    // Statistics
    totalUnits: 'Нийт өрөө',
    occupiedUnits: 'Эзэмшигчтэй',
    vacantUnits: 'Сул өрөө',
    occupancyRate: 'Ашиглалтын хувь',

    // Messages
    created: 'Барилга амжилттай үүслээ',
    updated: 'Барилга амжилттай шинэчлэгдлээ',
    deleted: 'Барилга амжилттай устлаа',
    deleteConfirm: 'Энэ барилгыг устгахдаа итгэлтэй байна уу?',
  },

  unit: {
    // Titles
    title: 'Өрөө',
    list: 'Өрөөний жагсаалт',
    detail: 'Өрөөний дэлгэрэнгүй',
    create: 'Шинэ өрөө нэмэх',
    edit: 'Өрөө засах',
    bulkCreate: 'Олон өрөө нэмэх',

    // Fields
    unitNumber: 'Өрөөний дугаар',
    floor: 'Давхар',
    area: 'Талбай (м²)',
    rooms: 'Өрөөний тоо',
    monthlyRent: 'Сарын түрээс',
    status: 'Төлөв',
    notes: 'Тэмдэглэл',

    // Statuses
    statuses: {
      vacant: 'Сул',
      occupied: 'Эзэмшигчтэй',
      maintenance: 'Засварт',
      reserved: 'Захиалсан',
    },

    // Bulk registration
    bulk: {
      startFloor: 'Эхлэх давхар',
      endFloor: 'Дуусах давхар',
      unitsPerFloor: 'Давхар тутмын өрөө',
      prefix: 'Угтвар',
      preview: 'Урьдчилан харах',
      generate: 'Үүсгэх',
      willCreate: '{count} өрөө үүсгэнэ',
    },

    // Messages
    created: 'Өрөө амжилттай үүслээ',
    updated: 'Өрөө амжилттай шинэчлэгдлээ',
    deleted: 'Өрөө амжилттай устлаа',
  },

  tenant: {
    // Titles
    title: 'Оршин суугчид',
    list: 'Оршин суугчдын жагсаалт',
    detail: 'Оршин суугчийн дэлгэрэнгүй',
    create: 'Шинэ оршин суугч нэмэх',
    edit: 'Оршин суугч засах',

    // Fields
    name: 'Нэр',
    phone: 'Утас',
    email: 'Имэйл',
    type: 'Төрөл',
    companyName: 'Компанийн нэр',
    idNumber: 'Регистрийн дугаар',
    emergencyContact: 'Яаралтай холбоо барих',
    emergencyPhone: 'Яаралтай холбоо барих утас',
    notes: 'Тэмдэглэл',

    // Types
    types: {
      individual: 'Хувь хүн',
      company: 'Компани',
    },

    // Contract status
    contractStatus: {
      active: 'Гэрээтэй',
      inactive: 'Гэрээгүй',
    },

    // Actions
    moveOut: 'Гарах',
    moveOutConfirm: 'Оршин суугчийг гаргахдаа итгэлтэй байна уу?',
    resetPassword: 'Нууц үг шинэчлэх',

    // Messages
    created: 'Оршин суугч амжилттай бүртгэгдлээ',
    createdWithPassword: 'Оршин суугч бүртгэгдлээ. Анхны нууц үг: {password}',
    updated: 'Оршин суугчийн мэдээлэл шинэчлэгдлээ',
    movedOut: 'Оршин суугч амжилттай гарлаа',
  },

  lease: {
    // Titles
    title: 'Гэрээ',
    list: 'Гэрээний жагсаалт',
    detail: 'Гэрээний дэлгэрэнгүй',
    create: 'Шинэ гэрээ',
    edit: 'Гэрээ засах',

    // Fields
    leaseNumber: 'Гэрээний дугаар',
    tenant: 'Оршин суугч',
    unit: 'Өрөө',
    startDate: 'Эхлэх огноо',
    endDate: 'Дуусах огноо',
    monthlyRent: 'Сарын түрээс',
    deposit: 'Барьцаа',
    paymentDueDay: 'Төлбөрийн өдөр',
    status: 'Төлөв',

    // Statuses
    statuses: {
      active: 'Идэвхтэй',
      expired: 'Хугацаа дууссан',
      terminated: 'Цуцлагдсан',
      pending: 'Хүлээгдэж буй',
    },

    // Terms
    terms: {
      title: 'Гэрээний нөхцөл',
      rentIncreaseRate: 'Түрээсийн өсөлт (%)',
      rentIncreaseInterval: 'Өсөлтийн давтамж (сар)',
      noticePeriod: 'Мэдэгдэх хугацаа (өдөр)',
      renewalTerms: 'Сунгах нөхцөл',
      specialConditions: 'Тусгай нөхцөл',
    },

    // Actions
    terminate: 'Гэрээ цуцлах',
    renew: 'Гэрээ сунгах',

    // Expiry alerts
    expiringIn: '{days} өдрийн дараа дуусна',
    expired: 'Хугацаа дууссан',

    // Messages
    created: 'Гэрээ амжилттай үүслээ',
    updated: 'Гэрээ амжилттай шинэчлэгдлээ',
    terminated: 'Гэрээ амжилттай цуцлагдлаа',
    renewed: 'Гэрээ амжилттай сунгагдлаа',
  },

  billing: {
    // Titles
    title: 'Төлбөр нэхэмжлэх',
    list: 'Нэхэмжлэхийн жагсаалт',
    detail: 'Нэхэмжлэхийн дэлгэрэнгүй',
    generate: 'Нэхэмжлэх үүсгэх',

    // Fields
    billingNumber: 'Нэхэмжлэхийн дугаар',
    billingMonth: 'Тооцооны сар',
    tenant: 'Оршин суугч',
    unit: 'Өрөө',
    issueDate: 'Огноо',
    dueDate: 'Төлөх хугацаа',
    totalAmount: 'Нийт дүн',
    paidAmount: 'Төлсөн дүн',
    remainingAmount: 'Үлдэгдэл',
    status: 'Төлөв',

    // Statuses
    statuses: {
      pending: 'Төлөгдөөгүй',
      partial: 'Хэсэгчлэн төлсөн',
      paid: 'Төлөгдсөн',
      overdue: 'Хугацаа хэтэрсэн',
      cancelled: 'Цуцлагдсан',
    },

    // Items
    items: {
      title: 'Нэхэмжлэхийн задаргаа',
      feeName: 'Төлбөрийн нэр',
      quantity: 'Тоо хэмжээ',
      unitPrice: 'Нэгж үнэ',
      amount: 'Дүн',
    },

    // Generate billings
    generateBillings: {
      title: 'Нэхэмжлэх үүсгэх',
      selectMonth: 'Сар сонгох',
      selectProperties: 'Барилга сонгох',
      allProperties: 'Бүх барилга',
      preview: 'Урьдчилан харах',
      willGenerate: '{count} нэхэмжлэх үүсгэнэ',
      generate: 'Үүсгэх',
    },

    // Actions
    recordPayment: 'Төлбөр бүртгэх',
    downloadPdf: 'PDF татах',
    sendReminder: 'Сануулга илгээх',

    // Messages
    generated: '{count} нэхэмжлэх амжилттай үүслээ',
    paymentRecorded: 'Төлбөр амжилттай бүртгэгдлээ',
    reminderSent: 'Сануулга амжилттай илгээгдлээ',
  },

  payment: {
    // Titles
    title: 'Төлбөр',
    record: 'Төлбөр бүртгэх',
    history: 'Төлбөрийн түүх',

    // Fields
    amount: 'Дүн',
    paymentDate: 'Төлсөн огноо',
    paymentMethod: 'Төлбөрийн хэлбэр',
    referenceNumber: 'Лавлах дугаар',
    notes: 'Тэмдэглэл',
    recordedBy: 'Бүртгэсэн',

    // Payment methods
    methods: {
      cash: 'Бэлэн мөнгө',
      bankTransfer: 'Банкны шилжүүлэг',
      card: 'Карт',
    },

    // Messages
    recorded: 'Төлбөр амжилттай бүртгэгдлээ',
    fullPayment: 'Төлбөр бүрэн төлөгдлөө',
    partialPayment: '₮{remaining} үлдэгдэлтэй',
  },

  meter: {
    // Titles
    title: 'Тоолуурын бүртгэл',
    list: 'Тоолуурын жагсаалт',
    input: 'Тоолуур оруулах',
    bulkInput: 'Олон тоолуур оруулах',
    history: 'Тоолуурын түүх',

    // Fields
    feeType: 'Төлбөрийн төрөл',
    previousReading: 'Өмнөх заалт',
    currentReading: 'Одоогийн заалт',
    consumption: 'Хэрэглээ',
    unitPrice: 'Нэгж үнэ',
    totalAmount: 'Нийт дүн',
    readingDate: 'Бүртгэсэн огноо',

    // Tenant submission
    submission: {
      title: 'Тоолуур бүртгэх',
      submit: 'Илгээх',
      photo: 'Зураг хавсаргах',
      submitted: 'Илгээсэн',
      approved: 'Баталгаажсан',
      rejected: 'Татгалзсан',
    },

    // Company review
    review: {
      title: 'Тоолуур шалгах',
      approve: 'Батлах',
      reject: 'Татгалзах',
      rejectReason: 'Татгалзсан шалтгаан',
    },

    // Validation
    validation: {
      mustBeGreater: 'Одоогийн заалт өмнөхөөс их байх ёстой',
      alreadySubmitted: 'Энэ сард аль хэдийн илгээсэн байна',
    },

    // Messages
    saved: 'Тоолуур амжилттай хадгалагдлаа',
    submitted: 'Тоолуур амжилттай илгээгдлээ',
    approved: 'Тоолуур амжилттай батлагдлаа',
    rejected: 'Тоолуур татгалзагдлаа',
  },

  feeType: {
    // Titles
    title: 'Төлбөрийн төрөл',
    list: 'Төлбөрийн төрлүүд',
    create: 'Шинэ төрөл нэмэх',
    edit: 'Төрөл засах',

    // Fields
    name: 'Нэр',
    calculationType: 'Тооцоолох арга',
    unitLabel: 'Нэгж',
    defaultAmount: 'Үндсэн дүн',
    defaultUnitPrice: 'Үндсэн нэгж үнэ',
    isActive: 'Идэвхтэй',
    displayOrder: 'Дараалал',

    // Calculation types
    calculationTypes: {
      fixed: 'Тогтмол',
      perSqm: 'Талбайгаар (м²)',
      metered: 'Тоолуураар',
      custom: 'Тусгай',
    },

    // Defaults
    defaults: {
      managementFee: 'Үйлчилгээний хураамж',
      waterFee: 'Усны төлбөр',
      garbageFee: 'Хогны төлбөр',
      electricityFee: 'Цахилгааны төлбөр',
      heatingFee: 'Дулааны төлбөр',
    },

    // Messages
    created: 'Төлбөрийн төрөл амжилттай үүслээ',
    updated: 'Төлбөрийн төрөл амжилттай шинэчлэгдлээ',
  },

  maintenance: {
    // Titles
    title: 'Засвар үйлчилгээ',
    list: 'Засварын жагсаалт',
    detail: 'Засварын дэлгэрэнгүй',
    create: 'Шинэ хүсэлт',
    edit: 'Хүсэлт засах',

    // Fields
    requestTitle: 'Гарчиг',
    description: 'Тайлбар',
    property: 'Барилга',
    unit: 'Өрөө',
    priority: 'Яаралтай эсэх',
    category: 'Ангилал',
    status: 'Төлөв',
    scheduledDate: 'Товлосон огноо',
    completedDate: 'Дууссан огноо',

    // Priorities
    priorities: {
      low: 'Бага',
      normal: 'Дунд',
      high: 'Өндөр',
      urgent: 'Яаралтай',
    },

    // Categories
    categories: {
      electrical: 'Цахилгаан',
      plumbing: 'Сантехник',
      hvac: 'Агаар сэлгэлт',
      cleaning: 'Цэвэрлэгээ',
      other: 'Бусад',
    },

    // Statuses
    statuses: {
      pending: 'Хүлээгдэж буй',
      inProgress: 'Хийгдэж буй',
      completed: 'Дууссан',
      cancelled: 'Цуцлагдсан',
    },

    // Vendor info
    vendor: {
      title: 'Гүйцэтгэгч',
      name: 'Гүйцэтгэгчийн нэр',
      phone: 'Утас',
      estimatedCost: 'Төсөвт өртөг',
      actualCost: 'Бодит өртөг',
    },

    // Messages
    created: 'Хүсэлт амжилттай үүслээ',
    updated: 'Хүсэлт амжилттай шинэчлэгдлээ',
    completed: 'Засвар амжилттай дууслаа',
  },

  notification: {
    // Titles
    title: 'Мэдэгдэл',
    settings: 'Мэдэгдлийн тохиргоо',
    history: 'Мэдэгдлийн түүх',

    // Types
    types: {
      billingIssued: 'Нэхэмжлэх үүссэн',
      paymentReminder: 'Төлбөрийн сануулга',
      overdueNotice: 'Хугацаа хэтэрсэн мэдэгдэл',
      paymentConfirmed: 'Төлбөр баталгаажсан',
      leaseExpiring: 'Гэрээ дуусах мэдэгдэл',
      maintenanceUpdate: 'Засварын мэдэгдэл',
      accountCreated: 'Бүртгэл үүссэн',
    },

    // Channels
    channels: {
      email: 'Имэйл',
      sms: 'SMS',
    },

    // Statuses
    statuses: {
      pending: 'Хүлээгдэж буй',
      sent: 'Илгээсэн',
      failed: 'Алдаа',
      skipped: 'Алгассан',
    },

    // Settings
    settingsLabels: {
      emailNotifications: 'Имэйл мэдэгдэл',
      smsNotifications: 'SMS мэдэгдэл',
      billingNotifications: 'Нэхэмжлэхийн мэдэгдэл',
      reminderNotifications: 'Сануулгын мэдэгдэл',
    },
  },

  admin: {
    // Titles
    title: 'Систем удирдлага',
    dashboard: 'Хянах самбар',
    companies: 'Компаниуд',
    admins: 'Админууд',
    settings: 'Тохиргоо',
    logs: 'Лог',

    // Company management
    company: {
      list: 'Компанийн жагсаалт',
      detail: 'Компанийн дэлгэрэнгүй',
      features: 'Функцууд',
      subscription: 'Захиалга',
      suspend: 'Түр зогсоох',
      activate: 'Идэвхжүүлэх',
      delete: 'Устгах',
    },

    // Statistics
    stats: {
      totalCompanies: 'Нийт компани',
      totalProperties: 'Нийт барилга',
      totalUnits: 'Нийт өрөө',
      totalTenants: 'Нийт оршин суугч',
      totalBilled: 'Нийт нэхэмжилсэн',
      totalPaid: 'Нийт төлөгдсөн',
      outstanding: 'Үлдэгдэл',
      mrr: 'Сарын орлого',
    },

    // Feature flags
    features: {
      title: 'Функцууд',
      multiProperty: 'Олон барилга',
      meterReadings: 'Тоолуурын бүртгэл',
      variableFees: 'Хувьсах төлбөр',
      floorPlan: 'Давхрын зураг',
      leaseManagement: 'Гэрээний удирдлага',
      tenantPortal: 'Оршин суугчийн портал',
      emailNotifications: 'Имэйл мэдэгдэл',
      smsNotifications: 'SMS мэдэгдэл',
    },

    // Subscription
    subscription: {
      plan: 'Багц',
      plans: {
        free: 'Үнэгүй',
        basic: 'Энгийн',
        pro: 'Мэргэжлийн',
        enterprise: 'Байгууллага',
      },
      price: 'Үнэ',
      maxProperties: 'Барилгын дээд хэмжээ',
      maxUnits: 'Өрөөний дээд хэмжээ',
      status: 'Төлөв',
    },

    // Audit log
    auditLog: {
      title: 'Үйл ажиллагааны лог',
      action: 'Үйлдэл',
      user: 'Хэрэглэгч',
      target: 'Зорилт',
      timestamp: 'Огноо цаг',
      details: 'Дэлгэрэнгүй',
    },

    // Warnings
    warnings: {
      suspendConfirm: 'Энэ компанийг түр зогсоохдоо итгэлтэй байна уу?',
      deleteConfirm: 'Энэ компанийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй!',
      typeCompanyName: 'Баталгаажуулахын тулд компанийн нэрийг бичнэ үү',
    },
  },

  floorPlan: {
    title: 'Давхрын зураг',
    editor: 'Зураг засах',
    viewer: 'Зураг харах',

    // Floor
    floor: 'Давхар',
    selectFloor: 'Давхар сонгох',
    addFloor: 'Давхар нэмэх',
    floorNumber: 'Давхрын дугаар',
    floorName: 'Давхрын нэр',

    // Edit
    editMode: 'Засах горим',
    viewMode: 'Харах горим',
    dragToMove: 'Чирж зөөх',
    resizeCorner: 'Булангаас хэмжээ өөрчлөх',

    // Legend
    legend: 'Тайлбар',
  },

  errors: {
    // General
    general: 'Алдаа гарлаа',
    notFound: 'Олдсонгүй',
    unauthorized: 'Эрх хүрэхгүй байна',
    forbidden: 'Хандах эрхгүй',
    serverError: 'Серверийн алдаа',
    networkError: 'Сүлжээний алдаа',

    // Validation
    required: 'Энэ талбар заавал бөглөх ёстой',
    invalidEmail: 'Имэйл буруу байна',
    invalidPhone: 'Утасны дугаар буруу байна',
    invalidNumber: 'Тоо буруу байна',
    minLength: 'Хамгийн багадаа {min} тэмдэгт байх ёстой',
    maxLength: 'Хамгийн ихдээ {max} тэмдэгт байх ёстой',
    passwordMismatch: 'Нууц үг таарахгүй байна',

    // Business errors
    duplicateEntry: 'Давхардсан мэдээлэл байна',
    limitExceeded: 'Хязгаар хэтэрсэн',
    operationFailed: 'Үйлдэл амжилтгүй боллоо',
  },
};
