export type BusinessHealth = "improving" | "stable" | "weakening";
export type ConvictionLevel = "High" | "Medium" | "Watch";

export type CompanyCategory =
  | "Everyday Brands"
  | "B2B Workhorses"
  | "Founder-led"
  | "Turnarounds"
  | "Cash Machines";

export interface MockCompany {
  id: string;
  ticker: string;
  name: string;
  tagline: string;
  category: CompanyCategory;
  partnerSummary: string;
  businessHealth: BusinessHealth;
  conviction: ConvictionLevel;
  neighbourhoodExplanation: string;
  story: {
    whatTheySell: string;
    whoBuys: string;
    whyTheyWin: string;
    whatCouldGoWrong: string;
  };
  customers: Array<{
    segment: string;
    whyTheyBuy: string;
  }>;
  money: {
    dailySales: string;
    margin: string;
    debt: string;
    cashflow: string;
  };
  trust: {
    founder: string;
    decisionStyle: string;
    skinInTheGame: string;
    longTermThinking: string;
  };
  forensics: Array<{
    title: string;
    status: "green" | "yellow" | "red";
    description: string;
  }>;
  fiveQuestions?: MockFiveQuestions;
}

type MockOwnerQuestionCard = {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  status?: "answered" | "insufficient_data";
};

type MockFiveQuestions = {
  business: MockOwnerQuestionCard;
  growth: MockOwnerQuestionCard;
  trust: MockOwnerQuestionCard;
  valuation: MockOwnerQuestionCard;
  holdThesis: MockOwnerQuestionCard;
};

export const companyCategories: CompanyCategory[] = [
  "Everyday Brands",
  "B2B Workhorses",
  "Founder-led",
  "Turnarounds",
  "Cash Machines",
];

export const mockCompanies: MockCompany[] = [
  {
    id: "microsoft",
    ticker: "MSFT",
    name: "Microsoft",
    tagline: "Builds software and cloud infrastructure used by businesses worldwide.",
    category: "B2B Workhorses",
    partnerSummary: "Microsoft helps companies run, build, and secure their digital work.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Microsoft were a shop in your neighbourhood, it would be the office supply store, power grid, and workshop that many businesses rely on every day.",
    story: {
      whatTheySell: "Microsoft sells the tools companies use to work, store information, build software, and protect their systems.",
      whoBuys: "Businesses, schools, governments, developers, and everyday people who need dependable digital tools.",
      whyTheyWin: "Many customers already run their work on Microsoft products, so adding more Microsoft tools is often the simplest choice.",
      whatCouldGoWrong: "Customers could slow technology spending, competitors could win important workloads, or security problems could weaken trust.",
    },
    customers: [
      { segment: "Large companies", whyTheyBuy: "Need reliable software that works across many teams and offices." },
      { segment: "Developers", whyTheyBuy: "Use Microsoft cloud and tools to build and run applications." },
      { segment: "Schools and governments", whyTheyBuy: "Need familiar tools, security, and long-term support." },
    ],
    money: {
      dailySales: "A large base of recurring software, cloud, and workplace tool subscriptions.",
      margin: "Software and cloud services can leave a meaningful amount after running costs.",
      debt: "Uses borrowing conservatively relative to the size and cash generation of the business.",
      cashflow: "Collects steady cash from customers who renew important work tools.",
    },
    trust: {
      founder: "Founder influence remains part of the culture, with professional managers running the company day to day.",
      decisionStyle: "Usually patient and platform-focused, building tools that customers can keep using for years.",
      skinInTheGame: "Leadership is paid partly through company performance, but ownership is broad because the company is mature.",
      longTermThinking: "Invests heavily in cloud, security, and AI infrastructure even when it raises near-term costs.",
    },
    forensics: [
      { title: "Profits backed by cash", status: "green", description: "The business regularly turns sales into real cash." },
      { title: "Customer concentration", status: "green", description: "Revenue comes from many types of customers instead of one buyer." },
      { title: "Security trust", status: "yellow", description: "Because customers rely on Microsoft deeply, security issues matter a lot." },
    ],
    fiveQuestions: {
      business: {
        question: "What does this company actually sell?",
        answer: "Microsoft sells software, cloud infrastructure, workplace tools, developer platforms, and AI capabilities to businesses, governments, schools, developers, and consumers.",
        confidence: "high",
        evidence: ["business_description", "products", "customers"],
        status: "answered",
      },
      growth: {
        question: "Where does the next rupee come from?",
        answer: "The next rupee most likely comes from cloud usage, software subscriptions, security demand, and AI-related infrastructure adoption.",
        confidence: "high",
        evidence: ["revenue_drivers", "strategic_priorities", "topic_evolution"],
        status: "answered",
      },
      trust: {
        question: "Can the story be trusted?",
        answer: "The story is credible while customers keep relying on Microsoft platforms, but owners should watch security trust, cloud competition, and AI infrastructure spending.",
        confidence: "medium",
        evidence: ["risks", "forensics", "business_health"],
        status: "answered",
      },
      valuation: {
        question: "Is the story already too expensive?",
        answer: "Valuation analysis requires market-price data which is not currently available.",
        confidence: "low",
        evidence: [],
        status: "insufficient_data",
      },
      holdThesis: {
        question: "Why would I hold it and what would change that?",
        answer: "An owner might hold Microsoft for its durable software base, cloud demand, and AI platform opportunity. Conviction would weaken if customer trust, cloud competitiveness, or cash generation deteriorated.",
        confidence: "medium",
        evidence: ["business_health", "strategic_priorities", "growth_question", "trust_question"],
        status: "answered",
      },
    },
  },
  {
    id: "apple",
    ticker: "AAPL",
    name: "Apple",
    tagline: "Designs devices, services, and software that anchor daily digital life.",
    category: "Everyday Brands",
    partnerSummary: "Apple keeps customers close through products people use repeatedly.",
    businessHealth: "stable",
    conviction: "High",
    neighbourhoodExplanation:
      "If Apple were a shop in your neighbourhood, it would be the trusted design studio where people return for tools they use all day.",
    story: {
      whatTheySell: "Apple sells phones, computers, watches, accessories, and digital services tied together by its software.",
      whoBuys: "People, families, students, creators, and businesses that value simple, polished devices.",
      whyTheyWin: "Customers often stay because Apple products work well together and feel familiar.",
      whatCouldGoWrong: "Device demand could slow, regulators could pressure app-store economics, or supply disruptions could affect launches.",
    },
    customers: [
      { segment: "Consumers", whyTheyBuy: "Want devices that are easy to use and work smoothly together." },
      { segment: "Creators", whyTheyBuy: "Need dependable hardware and software for creative work." },
      { segment: "Businesses", whyTheyBuy: "Use Apple devices for employees who value mobility and design." },
    ],
    money: {
      dailySales: "A mix of device sales and repeat service payments from a very large customer base.",
      margin: "Premium pricing and services help keep a strong amount after costs.",
      debt: "Carries debt but also has very large cash resources and steady earnings.",
      cashflow: "Generates substantial cash when customers buy devices and subscribe to services.",
    },
    trust: {
      founder: "The founder shaped the product culture, while current leadership focuses on execution and operations.",
      decisionStyle: "Careful, design-led, and selective about entering new product categories.",
      skinInTheGame: "Leadership incentives are tied to company performance, while ownership is broadly distributed.",
      longTermThinking: "Protects the ecosystem and customer experience even when growth is not immediate.",
    },
    forensics: [
      { title: "Brand loyalty", status: "green", description: "Many customers repeatedly buy within the Apple ecosystem." },
      { title: "Regulatory pressure", status: "yellow", description: "Rules around app stores and digital services could change economics." },
      { title: "Supply dependence", status: "yellow", description: "Major products rely on complex global manufacturing." },
    ],
    fiveQuestions: {
      business: {
        question: "What does this company actually sell?",
        answer: "Apple sells consumer devices, software, accessories, and digital services to consumers, creators, students, families, and businesses.",
        confidence: "high",
        evidence: ["business_description", "products", "customers"],
        status: "answered",
      },
      growth: {
        question: "Where does the next rupee come from?",
        answer: "The next rupee likely comes from device upgrades, services subscriptions, app ecosystem activity, and deeper customer use across Apple products.",
        confidence: "medium",
        evidence: ["revenue_drivers", "strategic_priorities"],
        status: "answered",
      },
      trust: {
        question: "Can the story be trusted?",
        answer: "The story depends on customer loyalty and product execution, while owners should watch regulatory pressure, supply dependence, and device demand cycles.",
        confidence: "medium",
        evidence: ["risks", "forensics", "business_health"],
        status: "answered",
      },
      valuation: {
        question: "Is the story already too expensive?",
        answer: "Valuation analysis requires market-price data which is not currently available.",
        confidence: "low",
        evidence: [],
        status: "insufficient_data",
      },
      holdThesis: {
        question: "Why would I hold it and what would change that?",
        answer: "An owner might hold Apple for customer loyalty, ecosystem strength, and recurring services. Conviction would weaken if product relevance, regulatory economics, or supply reliability worsened.",
        confidence: "medium",
        evidence: ["business_health", "strategic_priorities", "growth_question", "trust_question"],
        status: "answered",
      },
    },
  },
  {
    id: "costco",
    ticker: "COST",
    name: "Costco",
    tagline: "Runs membership warehouses built around value, trust, and repeat visits.",
    category: "Everyday Brands",
    partnerSummary: "Costco earns loyalty by keeping the customer bargain clear and consistent.",
    businessHealth: "stable",
    conviction: "High",
    neighbourhoodExplanation:
      "If Costco were a shop in your neighbourhood, it would be the warehouse club families trust for reliable value on the essentials.",
    story: {
      whatTheySell: "Costco sells groceries, household goods, fuel, and everyday products through paid warehouse memberships.",
      whoBuys: "Families, small businesses, and value-focused shoppers who buy in larger quantities.",
      whyTheyWin: "Members trust Costco to keep prices fair, which encourages repeat visits and renewals.",
      whatCouldGoWrong: "Higher costs, weaker consumer spending, or poor inventory choices could pressure the value promise.",
    },
    customers: [
      { segment: "Families", whyTheyBuy: "Save money on regular household needs." },
      { segment: "Small businesses", whyTheyBuy: "Buy supplies in bulk without complicated purchasing." },
      { segment: "Loyal members", whyTheyBuy: "Trust the company to offer good value without much comparison shopping." },
    ],
    money: {
      dailySales: "Large everyday shopping volumes supported by annual membership fees.",
      margin: "Keeps product markups low, while membership fees add dependable profit.",
      debt: "Generally avoids relying heavily on borrowing to run the business.",
      cashflow: "Collects cash from frequent shopping trips and recurring memberships.",
    },
    trust: {
      founder: "The founder-created culture still emphasizes value, simplicity, and member trust.",
      decisionStyle: "Disciplined and plain-spoken, focused on keeping the customer bargain intact.",
      skinInTheGame: "Management reputation is tied to preserving the membership model.",
      longTermThinking: "Often accepts lower markups today to strengthen loyalty over many years.",
    },
    forensics: [
      { title: "Membership renewal", status: "green", description: "Repeat membership behavior supports the business." },
      { title: "Low price promise", status: "green", description: "The company is known for protecting customer value." },
      { title: "Thin product markup", status: "yellow", description: "Low markups leave less room for mistakes." },
    ],
  },
  {
    id: "visa",
    ticker: "V",
    name: "Visa",
    tagline: "Operates payment rails used whenever money moves digitally.",
    category: "Cash Machines",
    partnerSummary: "Visa benefits from the steady shift from cash to digital payments.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Visa were a shop in your neighbourhood, it would be the toll road used every time money moves digitally.",
    story: {
      whatTheySell: "Visa runs a payment network that helps banks, merchants, and consumers move money electronically.",
      whoBuys: "Banks, merchants, payment companies, and shoppers who want payments to work quickly and safely.",
      whyTheyWin: "The network becomes more useful because many banks, merchants, and consumers already accept it.",
      whatCouldGoWrong: "Payment rules, fees, fraud, or new payment networks could reduce Visa's role.",
    },
    customers: [
      { segment: "Banks", whyTheyBuy: "Need a trusted payment network for card programs." },
      { segment: "Merchants", whyTheyBuy: "Want customers to pay easily in stores and online." },
      { segment: "Consumers", whyTheyBuy: "Expect cards and digital payments to work almost everywhere." },
    ],
    money: {
      dailySales: "Small fees on a very large number of digital payments.",
      margin: "The network model can leave a lot after operating costs because Visa does not lend the money itself.",
      debt: "Does not need heavy borrowing to support day-to-day payment volume.",
      cashflow: "Payment volume can turn into steady cash as transactions move through the network.",
    },
    trust: {
      founder: "Visa is a mature network company rather than a founder-led business.",
      decisionStyle: "Reliability-focused, protecting the network so payments keep working.",
      skinInTheGame: "Leadership is measured by network growth, trust, and long-term acceptance.",
      longTermThinking: "Invests in security, global acceptance, and new digital payment flows.",
    },
    forensics: [
      { title: "Does not lend the money", status: "green", description: "Visa mainly runs the network, so it avoids much direct credit risk." },
      { title: "Network trust", status: "green", description: "The business depends on payments working reliably." },
      { title: "Fee pressure", status: "yellow", description: "Merchants and regulators may push back on payment costs." },
    ],
  },
  {
    id: "adobe",
    ticker: "ADBE",
    name: "Adobe",
    tagline: "Makes creative and document tools used by professionals and teams.",
    category: "B2B Workhorses",
    partnerSummary: "Adobe sells important creative tools into workflows that are hard to replace.",
    businessHealth: "stable",
    conviction: "Medium",
    neighbourhoodExplanation:
      "If Adobe were a shop in your neighbourhood, it would be the studio that creators and office teams visit to finish polished work.",
    story: {
      whatTheySell: "Adobe sells creative, marketing, and document software used to make and manage digital work.",
      whoBuys: "Designers, creators, marketers, businesses, and document-heavy teams.",
      whyTheyWin: "Its tools are deeply embedded in professional workflows and file formats.",
      whatCouldGoWrong: "New creative tools, pricing pressure, or AI changes could make customers reconsider subscriptions.",
    },
    customers: [
      { segment: "Creative professionals", whyTheyBuy: "Need trusted tools for design, video, images, and publishing." },
      { segment: "Marketing teams", whyTheyBuy: "Use Adobe to create, manage, and measure digital customer experiences." },
      { segment: "Office teams", whyTheyBuy: "Need dependable document tools for PDFs and approvals." },
    ],
    money: {
      dailySales: "Recurring subscriptions from creative, document, and marketing software.",
      margin: "Digital software subscriptions can leave strong room after costs.",
      debt: "Uses borrowing selectively, mainly around larger business needs.",
      cashflow: "Subscriptions provide regular cash when customers keep renewing.",
    },
    trust: {
      founder: "Founder influence is historical; the current company is run by professional leadership.",
      decisionStyle: "Product-led, with a focus on keeping creative tools relevant as work changes.",
      skinInTheGame: "Leadership incentives connect to long-term company performance.",
      longTermThinking: "Invests in AI-assisted creation while trying to protect professional trust.",
    },
    forensics: [
      { title: "Subscription base", status: "green", description: "Many customers pay regularly for important tools." },
      { title: "AI disruption", status: "yellow", description: "New AI tools could change how creative work gets done." },
      { title: "Workflow dependence", status: "green", description: "Customers often build repeat habits around Adobe files and tools." },
    ],
  },
  {
    id: "netflix",
    ticker: "NFLX",
    name: "Netflix",
    tagline: "Builds a global entertainment service with recurring customer relationships.",
    category: "Turnarounds",
    partnerSummary: "Netflix is working to turn a large audience into durable entertainment economics.",
    businessHealth: "improving",
    conviction: "Medium",
    neighbourhoodExplanation:
      "If Netflix were a shop in your neighbourhood, it would be the theater subscription people keep because there is always something new to watch.",
    story: {
      whatTheySell: "Netflix sells entertainment subscriptions with shows, movies, live events, and games.",
      whoBuys: "Households around the world looking for convenient entertainment.",
      whyTheyWin: "Its large audience and viewing data help it fund and recommend content people keep watching.",
      whatCouldGoWrong: "Content spending could disappoint, competitors could take attention, or customers could cancel when budgets tighten.",
    },
    customers: [
      { segment: "Families", whyTheyBuy: "Want a simple entertainment service with choices for different tastes." },
      { segment: "International viewers", whyTheyBuy: "Find local and global shows in one service." },
      { segment: "Advertisers", whyTheyBuy: "Want access to engaged viewers as Netflix adds ad-supported plans." },
    ],
    money: {
      dailySales: "Monthly subscription payments from a large global member base.",
      margin: "Can improve when subscriber revenue grows faster than content and technology costs.",
      debt: "Uses borrowing less heavily than during its earlier growth years.",
      cashflow: "Cash depends on balancing membership payments with heavy content spending.",
    },
    trust: {
      founder: "Founder culture helped shape the company, though leadership has broadened.",
      decisionStyle: "Data-informed and willing to change the model when viewing habits shift.",
      skinInTheGame: "Management is tied to subscriber satisfaction and durable entertainment economics.",
      longTermThinking: "Builds global content and advertising options to keep the service useful over time.",
    },
    forensics: [
      { title: "Subscriber habit", status: "green", description: "Many customers treat Netflix as a regular household service." },
      { title: "Content costs", status: "yellow", description: "Shows and movies are expensive, and not every bet works." },
      { title: "Competition for attention", status: "yellow", description: "Many services compete for the same viewing time." },
    ],
  },
  {
    id: "amazon",
    ticker: "AMZN",
    name: "Amazon",
    tagline: "Runs commerce, logistics, advertising, and cloud infrastructure at scale.",
    category: "Founder-led",
    partnerSummary: "Amazon combines customer convenience with infrastructure businesses built for scale.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Amazon were a shop in your neighbourhood, it would be the everything store with its own delivery network and a power room for other businesses.",
    story: {
      whatTheySell: "Amazon sells online retail, marketplace services, advertising, memberships, devices, and cloud computing.",
      whoBuys: "Shoppers, third-party sellers, advertisers, developers, startups, and large companies.",
      whyTheyWin: "Convenience, scale, logistics, and cloud infrastructure make Amazon useful to many different customers.",
      whatCouldGoWrong: "Retail margins can be thin, regulators may challenge its size, and cloud competition is intense.",
    },
    customers: [
      { segment: "Online shoppers", whyTheyBuy: "Want broad selection, fast delivery, and convenience." },
      { segment: "Third-party sellers", whyTheyBuy: "Use Amazon to reach a large customer base and handle fulfillment." },
      { segment: "Cloud customers", whyTheyBuy: "Need reliable computing power without building their own data centers." },
    ],
    money: {
      dailySales: "A combination of shopping, seller services, ads, memberships, and cloud usage.",
      margin: "Cloud and advertising can leave more after costs than traditional retail.",
      debt: "Uses borrowing and leases to support warehouses, logistics, and infrastructure.",
      cashflow: "Collects cash quickly from customers while investing heavily in growth and infrastructure.",
    },
    trust: {
      founder: "Founder principles still shape customer obsession and long-term experimentation.",
      decisionStyle: "Willing to invest heavily and tolerate messy near-term results for scale.",
      skinInTheGame: "Leadership is expected to protect long-term customer value and operational discipline.",
      longTermThinking: "Builds infrastructure years before demand is fully visible.",
    },
    forensics: [
      { title: "Multiple engines", status: "green", description: "Retail, cloud, ads, and marketplace services can support each other." },
      { title: "Heavy investment", status: "yellow", description: "Large infrastructure spending can pressure near-term results." },
      { title: "Regulatory scrutiny", status: "yellow", description: "Amazon's scale attracts attention from regulators." },
    ],
  },
  {
    id: "nvidia",
    ticker: "NVDA",
    name: "Nvidia",
    tagline: "Designs chips and platforms that power accelerated computing and AI systems.",
    category: "Founder-led",
    partnerSummary: "Nvidia sells the picks and shovels for companies building modern AI infrastructure.",
    businessHealth: "improving",
    conviction: "Watch",
    neighbourhoodExplanation:
      "If Nvidia were a shop in your neighbourhood, it would be the specialist supplier every builder visits before starting advanced technology projects.",
    story: {
      whatTheySell: "Nvidia sells advanced chips, systems, and software used for AI, graphics, and accelerated computing.",
      whoBuys: "Cloud companies, AI labs, enterprises, researchers, gamers, and car technology teams.",
      whyTheyWin: "Its chips and software ecosystem are difficult to match, and many AI builders already rely on them.",
      whatCouldGoWrong: "Demand could cool, customers could build their own chips, or supply limits could constrain growth.",
    },
    customers: [
      { segment: "Cloud providers", whyTheyBuy: "Need powerful chips to offer AI computing to their customers." },
      { segment: "AI builders", whyTheyBuy: "Use Nvidia systems to train and run advanced models." },
      { segment: "Gamers and creators", whyTheyBuy: "Want strong graphics performance and creative computing power." },
    ],
    money: {
      dailySales: "High-value chip and system sales tied to AI and accelerated computing demand.",
      margin: "Specialized products can leave strong room after costs when demand is high.",
      debt: "Does not rely heavily on debt compared with the scale of current earnings.",
      cashflow: "Can generate significant cash when supply meets strong customer demand.",
    },
    trust: {
      founder: "Founder-led culture remains central to product ambition and technical focus.",
      decisionStyle: "Bold and technology-led, often preparing for computing shifts before they are obvious.",
      skinInTheGame: "Founder leadership and long company history create visible alignment with the business.",
      longTermThinking: "Invests in platforms and developer tools, not only individual chips.",
    },
    forensics: [
      { title: "Demand concentration", status: "yellow", description: "A lot of recent excitement is tied to AI infrastructure spending." },
      { title: "Technical lead", status: "green", description: "Nvidia has a strong position in advanced computing tools." },
      { title: "Customer self-supply", status: "yellow", description: "Some large customers may try to design more of their own chips." },
    ],
  },
];

export const homeHoldings = mockCompanies.slice(0, 3);

export function findCompanyByTicker(ticker: string): MockCompany | undefined {
  const normalizedTicker = ticker.trim().toUpperCase();

  return mockCompanies.find((company) => company.ticker === normalizedTicker);
}

export function filterCompanies(
  companies: MockCompany[],
  searchTerm: string,
  selectedCategory?: CompanyCategory | null,
): MockCompany[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return companies.filter((company) => {
    const matchesSearch = normalizedSearch.length === 0
      || company.name.toLowerCase().includes(normalizedSearch)
      || company.ticker.toLowerCase().includes(normalizedSearch)
      || company.tagline.toLowerCase().includes(normalizedSearch);

    const matchesCategory = !selectedCategory || company.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
}
