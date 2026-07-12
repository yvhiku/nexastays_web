/**
 * Sync fr.json and ar.json with en.json structure + locale overlays.
 * Run: node scripts/sync-locales.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../lib/i18n/locales");

function deepMerge(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return source ?? target;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] && typeof out[k] === "object" ? out[k] : {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const frOverlay = {
  nav: {
    safetyTransparency: "Sécurité et transparence",
    about: "À propos et contact",
  },
  home: {
    hero: {
      badge: "Maroc en premier · Séjours vérifiés · Lancement contrôlé",
      title:
        "Des séjours au Maroc avec plus de sécurité, de transparence et de confort.",
      subtitle:
        "Nexa Stays est une plateforme marocaine de séjours vérifiés pour l'hébergement de courte durée. Nous aidons les voyageurs à réserver avec plus de confiance et les hôtes à publier leurs biens dans un cadre plus clair, structuré et sécurisé.",
      searchStays: "Trouver un séjour",
      becomeHost: "Devenir hôte",
      verifiedHosts: "Hôtes vérifiés",
      controlledListings: "Annonces contrôlées",
      clearRules: "Règles claires",
      protectedAddress: "Adresse protégée",
      localSupport: "Support local",
    },
    search: {
      checkin: "Arrivée",
      checkout: "Départ",
      destinationPlaceholder: "Marrakech, Casablanca, Agadir...",
      addDates: "Choisir une date",
      helperText:
        "L'adresse exacte, le contact d'accueil et les instructions privées de check-in ne sont partagés que selon le statut officiel de confirmation de réservation.",
      verifiedHosts: "Hôtes vérifiés",
      controlledListings: "Annonces contrôlées",
    },
    why: {
      title: "Réserver ou héberger ne devrait pas être un risque.",
      subtitle:
        "Au Maroc, de nombreux séjours de courte durée passent encore par des messages directs, des réseaux sociaux ou des processus informels. Nexa Stays vise une alternative locale plus structurée — plus simple, plus fiable et plus transparente.",
      safety: "Sécurité",
      safetyDesc:
        "Profils, annonces et informations essentielles sont progressivement vérifiés pour réduire la fraude, la désinformation et les litiges.",
      transparency: "Transparence",
      transparencyDesc:
        "Règles, conditions, détails du bien, statuts de réservation et étapes importantes doivent être clairs avant, pendant et après la réservation.",
      comfort: "Confort",
      comfortDesc:
        "Les voyageurs doivent comprendre ce qu'ils réservent. Les hôtes doivent comprendre qui réserve. Les deux bénéficient d'un cadre plus simple et rassurant.",
    },
    stats: {
      controlledLaunch: "Phase de lancement contrôlé",
      casablancaFirst: "Lancement d'abord à Casablanca",
      verifiedListings: "Hôtes et annonces vérifiés",
      guestFee: "Frais de service voyageur prévus",
    },
    howItWorks: {
      title1: "Rechercher, examiner, demander, confirmer.",
      title2: "Clair avant de s'engager.",
      subtitle:
        "Une réservation ne doit pas reposer sur des suppositions. Elle doit reposer sur des informations claires, des règles visibles, des détails vérifiés et un statut officiel.",
      step1Title: "Rechercher un séjour",
      step1Desc:
        "Recherchez par ville, date d'arrivée, date de départ et nombre de voyageurs. L'adresse exacte reste protégée jusqu'à la confirmation.",
      step2Title: "Examiner l'annonce",
      step2Desc:
        "Vérifiez photos, règles, capacité, équipements, frais et niveau de vérification avant d'envoyer une demande.",
      step3Title: "Envoyer une demande de réservation",
      step3Desc:
        "Envoyer une demande ne confirme pas automatiquement le séjour. Elle est examinée par l'hôte et Nexa Stays si nécessaire.",
      step4Title: "Confirmer et arriver",
      step4Desc:
        "Les informations privées d'arrivée ne sont partagées que lorsque le statut de réservation est officiellement confirmé.",
      startExploring: "Explorer les séjours",
      checkinConfirmed: "Réservation confirmée",
      contactShared:
        "Détails d'arrivée privés partagés selon le processus de la plateforme",
    },
    hostCta: {
      eyebrow: "Pour les hôtes",
      title: "Publiez votre bien avec plus de structure et de crédibilité.",
      subtitle:
        "Nexa Stays accompagne hôtes individuels, propriétaires, gestionnaires, agences, hôtels, résidences, maisons d'hôtes et riads souhaitant proposer des séjours de courte durée dans un cadre plus professionnel.",
      bullet1: "Annonces structurées et vérifiées",
      bullet2: "Règles et conditions visibles avant la réservation",
      bullet3: "Demandes plus qualifiées de voyageurs informés",
      bullet4: "Support local adapté au marché marocain",
      startHosting: "Commencer l'inscription hôte",
      talkPartnerships: "Contacter Nexa Stays",
    },
  },
  hostApply: {
    title: "Candidature hôte",
    progress: "Progression",
    privacyTitle: "Confidentialité et sécurité",
    privacyNote:
      "Téléphone, e-mail et adresse exacte sont masqués jusqu'à ce que les deux parties soient vérifiées et la réservation confirmée.",
    supportLine: "Besoin d'aide ? Contactez Nexa Stays :",
    step1Title: "Qui êtes-vous ?",
    step1Subtitle:
      "Indiquez votre type d'hôte. Cela nous aide à organiser votre candidature.",
    step1ApartmentTitle: "Hôte appartement / villa",
    step1ApartmentDesc: "Appartements, studios, maisons, villas ou unités uniques",
    step1HotelTitle: "Hôte hôtel / résidence",
    step1HotelDesc: "Hôtels, résidences, apart-hôtels ou plusieurs chambres",
    step1HostelTitle: "Hôte auberge / hostel",
    step1HostelDesc: "Auberges de jeunesse, dortoirs, chambres partagées",
    step2Title: "Votre profil hôte",
    step2Subtitle:
      "Utilisez le même nom que sur vos documents si une vérification est demandée.",
    step3Title: "Confirmer le contact",
    step3Subtitle:
      "Nous enverrons un code sur votre téléphone et votre e-mail pour vérifier vos coordonnées.",
    step4Title: "Vérifier votre identité",
    step4Subtitle:
      "Cela protège voyageurs, hôtes et propriétaires. Requis pour devenir hôte sur Nexa Stays.",
    submittedTitle: "Candidature envoyée",
    submittedDesc:
      "Merci ! Nous avons reçu votre candidature hôte et votre vérification d'identité. Notre équipe l'examinera et vous serez notifié une fois approuvé.",
    approvedTitle: "Vous êtes un hôte approuvé",
    approvedDesc:
      "Votre candidature hôte a été approuvée. Bienvenue sur Nexa Stays !",
    goToDashboard: "Aller au tableau de bord",
    backToHome: "Retour à l'accueil",
    launchNote:
      "Nexa Stays est actuellement en phase de lancement contrôlé. Les candidatures hôtes sont examinées progressivement.",
  },
  privacy: {
    whyCollectList:
      "Créer et gérer des comptes ; Vérifier l'identité et assurer la sécurité ; Faciliter les réservations ; Prévenir la fraude ; Fournir l'assistance ; Respecter les obligations légales",
    shareGuestsHosts: "A) Entre voyageurs et hôtes",
    shareProviders: "B) Prestataires de services",
    shareLegal: "C) Motifs légaux",
  },
  safety: {
    badge: "Annonces vérifiées · Informations protégées · Statuts clairs",
    title: "Sécurité et transparence pour voyageurs et hôtes.",
    subtitle:
      "Nexa Stays repose sur un principe simple : un séjour de courte durée doit être clair, traçable et protégé avant d'être confirmé.",
    approachEyebrow: "Notre approche",
    approachTitle:
      "La confiance doit être intégrée au processus, pas seulement promise.",
    approachBody:
      "De nombreux séjours passent encore par des conversations fragmentées, des captures d'écran ou des paiements informels. Nexa Stays apporte une structure : vérification, règles, statut de réservation et protection des données privées.",
    coreStatement:
      "La sécurité n'est pas une fonctionnalité unique. C'est un processus complet : vérifier l'essentiel, afficher ce qui doit être public, protéger ce qui doit rester privé et suivre chaque étape importante.",
    guestEyebrow: "Pour les voyageurs",
    guestTitle:
      "Les voyageurs ont besoin d'informations fiables avant de partir.",
    guestPoint1Title: "Détails d'annonce clairs",
    guestPoint1Desc:
      "Consultez type de bien, ville, quartier, capacité, équipements, règles, prix et niveau de vérification avant d'avancer.",
    guestPoint2Title: "Règles de maison visibles",
    guestPoint2Desc:
      "Les règles importantes sont affichées avant la réservation : capacité, tabac, animaux, visiteurs et conditions de check-in.",
    guestPoint3Title: "Adresse exacte protégée",
    guestPoint3Desc:
      "L'adresse exacte n'est pas affichée publiquement. Elle est partagée uniquement selon le statut officiel de confirmation.",
    guestPoint4Title: "Demande de réservation suivie",
    guestPoint4Desc:
      "Voyez si votre demande est envoyée, en examen, approuvée en attente de paiement, confirmée, refusée, annulée ou terminée.",
    guestReminder:
      "Ne considérez jamais un séjour comme confirmé tant que le statut officiel n'indique pas clairement « confirmé ».",
    hostEyebrow: "Pour les hôtes",
    hostTitle:
      "Les hôtes ont besoin de protection avant d'ouvrir leur bien.",
    hostPoint1Title: "Vérification hôte structurée",
    hostPoint1Desc:
      "Les candidatures hôtes et la vérification d'identité sont examinées avant la publication d'annonces.",
    hostPoint2Title: "Annonces contrôlées",
    hostPoint2Desc:
      "Les annonces sont examinées progressivement avant publication ou vérification complète pendant le lancement.",
    hostPoint3Title: "Demandes qualifiées",
    hostPoint3Desc:
      "Les voyageurs comprennent les règles et conditions avant d'envoyer une demande, ce qui réduit les malentendus.",
    hostPoint4Title: "Protection des informations privées",
    hostPoint4Desc:
      "L'adresse exacte et le contact d'accueil restent protégés jusqu'au statut de confirmation requis.",
    findStay: "Trouver un séjour",
    becomeHost: "Devenir hôte",
  },
  footer: {
    tagline:
      "Plateforme marocaine de séjours vérifiés — sécurité, transparence et confort pour voyageurs et hôtes.",
    terms: "Mentions légales et conditions",
    refund: "Politiques de la plateforme",
    aboutUs: "À propos et contact",
    secured: "Nexa Stays est actuellement en phase de lancement contrôlé au Maroc.",
    disclaimer:
      "Nexa Stays est une plateforme numérique marocaine pour des séjours vérifiés de courte durée. Fonctionnalités, frais, villes, processus de vérification et disponibilité peuvent évoluer pendant le lancement. L'utilisation du service est soumise à nos Mentions légales, Politique de confidentialité et Politiques de la plateforme.",
    emailContact: "Général",
    emailSupport: "Assistance",
    emailPartnerships: "Partenariats",
  },
  listings: {
    staysTitle: "Trouvez un séjour au Maroc avec plus de confiance.",
    staysSubtitle:
      "Explorez des hébergements de courte durée avec des informations plus claires, des règles visibles, des hôtes vérifiés selon le niveau requis et un processus de demande de réservation mieux structuré.",
    noSurprises:
      "L'adresse exacte et les détails privés d'arrivée ne sont partagés que lorsque votre réservation est officiellement confirmée.",
  },
  listingDetail: {
    requestToBook: "Demander à réserver",
    signInToBook: "Se connecter pour réserver",
  },
  about: {
    ourStory: "À propos de Nexa Stays",
    title:
      "Une plateforme marocaine de séjours vérifiés pour un hébergement plus sûr et plus clair.",
    subtitle:
      "Nexa Stays a été créée pour rendre l'hébergement de courte durée plus sûr, plus clair et plus confortable pour les voyageurs et les hôtes. Nous construisons une alternative locale pour un marché qui a besoin de plus de confiance, d'une meilleure structure et d'informations plus claires avant la confirmation.",
    theProblem: "Le problème",
    approachTitle: "Sécurité, transparence et confort pour les deux parties.",
    approachSubtitle:
      "Une plateforme n'est utile que si elle crée la confiance pour tous. Nexa Stays repose sur trois principes fondamentaux.",
    pillar1Title: "Sécurité",
    pillar1Desc:
      "La sécurité signifie réduire les risques inutiles avant, pendant et après une réservation. Nexa Stays protège les adresses exactes, examine les annonces, structure les informations hôtes et suit les statuts des demandes.",
    pillar2Title: "Transparence",
    pillar2Desc:
      "La transparence signifie que voyageurs et hôtes ne doivent pas dépendre d'hypothèses. Règles, capacité, tarifs, conditions d'arrivée, niveaux de vérification et statuts doivent être visibles et compréhensibles.",
    pillar3Title: "Confort",
    pillar3Desc:
      "Le confort ne concerne pas seulement le bien. C'est aussi le processus. Les voyageurs doivent se sentir plus confiants avant l'arrivée. Les hôtes doivent se sentir plus protégés avant d'accepter une demande.",
    privacyByDesign: "Confidentialité intégrée",
    privacyTitle: "La confidentialité fait partie de la sécurité.",
    privacyBody:
      "Nous protégeons la confidentialité avec une règle stricte : les coordonnées sont masquées jusqu'à ce que les deux parties soient vérifiées et la réservation confirmée.",
    privacyRule1: "Pas de numéros directs avant confirmation",
    privacyRule2: "Pas d'e-mails pour contourner la plateforme",
    privacyRule3: "Pas d'adresse exacte avant confirmation",
    privacyRule4: "La communication reste dans Nexa jusqu'à confirmation réelle",
    guestFeeLabel: "Frais voyageur — parmi les plus bas du marché",
    feeSplitNote:
      "Nous répartissons les frais équitablement. Les voyageurs paient moins. Les propriétaires gardent plus.",
    betterMatching: "Meilleure correspondance",
    matchingTitle: "Plus que la réservation : une meilleure correspondance.",
    matchingBody:
      "Un bon séjour, c'est aussi une question d'adéquation. Nexa Stays apporte une couche plus humaine pour que les voyageurs trouvent des lieux qui leur conviennent vraiment.",
    partnerCta: "Vous souhaitez devenir partenaire ?",
    partnerBody:
      "Si vous gérez des biens, des hôtels ou un portefeuille d'unités, nous pouvons vous intégrer comme partenaire.",
    contactPartnerships: "Contacter les partenariats →",
    startHosting: "Commencer l'hébergement",
  },
};

const arOverlay = {
  nav: {
    safetyTransparency: "الأمان والشفافية",
    about: "من نحن والتواصل",
  },
  home: {
    hero: {
      badge: "المغرب أولاً · إقامات موثقة · إطلاق مُراقَب",
      title: "إقامات في المغرب بمزيد من الأمان والشفافية والراحة.",
      subtitle:
        "Nexa Stays منصة مغربية لإقامات موثقة قصيرة المدة. نساعد الضيوف على الحجز بثقة أكبر والمضيفين على إدراج عقاراتهم في بيئة أوضح وأكثر تنظيماً وأماناً.",
      searchStays: "البحث عن إقامة",
      becomeHost: "كن مضيفاً",
      verifiedHosts: "مضيفون موثقون",
      controlledListings: "قوائم مُراقَبة",
      clearRules: "قواعد واضحة",
      protectedAddress: "عنوان محمي",
      localSupport: "دعم محلي",
    },
    search: {
      checkin: "تاريخ الوصول",
      checkout: "تاريخ المغادرة",
      destinationPlaceholder: "مراكش، الدار البيضاء، أكادير...",
      addDates: "اختر تاريخاً",
      helperText:
        "يُشارك العنوان الدقيق وجهة الاتصال للاستقبال وتعليمات تسجيل الوصول الخاصة فقط وفق حالة تأكيد الحجز الرسمية.",
      verifiedHosts: "مضيفون موثقون",
      controlledListings: "قوائم مُراقَبة",
    },
    why: {
      title: "لا ينبغي أن يشعر الحجز أو الاستضافة بالمخاطرة.",
      subtitle:
        "في المغرب، لا تزال كثير من الإقامات قصيرة المدة تتم عبر رسائل مباشرة أو شبكات اجتماعية أو عمليات غير رسمية. تهدف Nexa Stays إلى بديل محلي أكثر تنظيماً — أبسط وأكثر موثوقية وشفافية.",
      safety: "الأمان",
      safetyDesc:
        "يتم التحقق تدريجياً من الملفات والقوائم والمعلومات الأساسية للحد من الاحتيال والمعلومات المضللة والنزاعات.",
      transparency: "الشفافية",
      transparencyDesc:
        "يجب أن تكون القواعد والشروط وتفاصيل العقار وحالات الحجز والخطوات المهمة واضحة قبل الحجز وأثناءه وبعده.",
      comfort: "الراحة",
      comfortDesc:
        "يجب أن يفهم الضيوف ما يحجزونه. ويجب أن يفهم المضيفون من يحجز. يستفيد الطرفان من إطار أبسط وأكثر طمأنينة.",
    },
    stats: {
      controlledLaunch: "مرحلة إطلاق مُراقَبة",
      casablancaFirst: "إطلاق يبدأ بالدار البيضاء",
      verifiedListings: "مضيفون وقوائم موثقة",
      guestFee: "رسوم خدمة الضيف المخططة",
    },
    howItWorks: {
      title1: "ابحث، راجع، اطلب، أكّد.",
      title2: "وضوح قبل الالتزام.",
      subtitle:
        "لا ينبغي أن يعتمد الحجز على الافتراضات. بل على معلومات واضحة وقواعد ظاهرة وتفاصيل موثقة وحالة رسمية.",
      step1Title: "ابحث عن إقامة",
      step1Desc:
        "ابحث حسب المدينة وتاريخ الوصول والمغادرة وعدد الضيوف. يبقى العنوان الدقيق محمياً حتى التأكيد.",
      step2Title: "راجع القائمة",
      step2Desc:
        "تحقق من الصور والقواعد والسعة والمرافق والرسوم ومستوى التحقق قبل إرسال الطلب.",
      step3Title: "أرسل طلب حجز",
      step3Desc:
        "إرسال طلب لا يؤكد الإقامة تلقائياً. يُراجعه المضيف وNexa Stays عند الحاجة.",
      step4Title: "أكّد وصل",
      step4Desc:
        "تُشارك معلومات الوصول الخاصة فقط عندما تكون حالة الحجز مؤكدة رسمياً.",
      startExploring: "استكشف الإقامات",
      checkinConfirmed: "تم تأكيد الحجز",
      contactShared: "تفاصيل الوصول الخاصة تُشارك وفق عملية المنصة",
    },
    hostCta: {
      eyebrow: "للمضيفين",
      title: "أدرج عقارك بمزيد من التنظيم والمصداقية.",
      subtitle:
        "تدعم Nexa Stays المضيفين الأفراد والملاك والمديرين والوكالات والفنادق والإقامات وبيوت الضيافة والرياض الراغبين في تقديم إقامات قصيرة في إطار أكثر احترافية.",
      bullet1: "قوائم منظمة وموثقة",
      bullet2: "قواعد وشروط ظاهرة قبل الحجز",
      bullet3: "طلبات أكثر جدية من ضيوف مطلعين",
      bullet4: "دعم محلي ملائم للسوق المغربي",
      startHosting: "ابدأ تسجيل المضيف",
      talkPartnerships: "تواصل مع Nexa Stays",
    },
  },
  hostApply: {
    title: "طلب الانضمام كمضيف",
    progress: "التقدم",
    privacyTitle: "الخصوصية والأمان",
    privacyNote:
      "يُخفى الهاتف والبريد والعنوان الدقيق حتى يتم التحقق من الطرفين وتأكيد الحجز.",
    supportLine: "تحتاج مساعدة؟ تواصل مع Nexa Stays:",
    step1Title: "من أنت؟",
    step1Subtitle: "أخبرنا بنوع المضيف الذي أنت. يساعدنا ذلك في تنظيم طلبك.",
    step1ApartmentTitle: "مضيف شقة / فيلا",
    step1ApartmentDesc: "شقق، استوديوهات، منازل، فلل أو وحدات فردية",
    step1HotelTitle: "مضيف فندق / إقامة",
    step1HotelDesc: "فنادق، إقامات، شقق فندقية أو عدة غرف",
    step1HostelTitle: "مضيف نزل / هوستل",
    step1HostelDesc: "نزل، مهاجع، غرف مشتركة أو إقامات للمسافرين",
    step2Title: "ملف المضيف",
    step2Subtitle: "استخدم الاسم نفسه كما في وثائقك إذا طُلب التحقق.",
    step3Title: "تأكيد جهة الاتصال",
    step3Subtitle: "سنرسل رمزاً إلى هاتفك وبريدك للتحقق من بياناتك.",
    step4Title: "تحقق من هويتك",
    step4Subtitle:
      "هذا يحمي الضيوف والمضيفين والملاك. مطلوب لتصبح مضيفاً على Nexa Stays.",
    submittedTitle: "تم إرسال الطلب",
    submittedDesc:
      "شكراً! استلمنا طلبك كمضيف والتحقق من هويتك. سيراجعه فريقنا وسنُعلمك عند الموافقة.",
    approvedTitle: "أنت مضيف معتمد",
    approvedDesc: "تمت الموافقة على طلبك كمضيف. مرحباً بك في Nexa Stays!",
    goToDashboard: "الذهاب إلى لوحة التحكم",
    backToHome: "العودة للرئيسية",
    launchNote:
      "Nexa Stays حالياً في مرحلة إطلاق مُراقَبة. تُراجع طلبات المضيفين تدريجياً.",
  },
  privacy: {
    whyCollectList:
      "إنشاء وإدارة الحسابات؛ التحقق من الهوية وضمان الأمان؛ تسهيل الحجوزات؛ منع الاحتيال؛ تقديم الدعم؛ الوفاء بالالتزامات القانونية",
    shareGuestsHosts: "أ) بين الضيوف والمضيفين",
    shareProviders: "ب) مزودو الخدمات",
    shareLegal: "ج) أسباب قانونية",
  },
  safety: {
    badge: "قوائم موثقة · معلومات محمية · حالات واضحة",
    title: "الأمان والشفافية للضيوف والمضيفين.",
    subtitle:
      "تُبنى Nexa Stays على مبدأ بسيط: يجب أن تكون الإقامة قصيرة المدة واضحة وقابلة للتتبع ومحمية قبل التأكيد.",
    approachEyebrow: "نهجنا",
    approachTitle: "يجب أن تُبنى الثقة في العملية، لا تُوعد بها فقط.",
    approachBody:
      "تعتمد كثير من الإقامات على محادثات مجزأة أو لقطات شاشة أو دفعات غير رسمية. تضيف Nexa Stays هيكلاً: تحقق وقواعد وحالة حجز وحماية للبيانات الخاصة.",
    coreStatement:
      "الأمان ليس ميزة واحدة. إنه عملية كاملة: التحقق مما يهم، وإظهار ما يجب أن يكون عاماً، وحماية ما يجب أن يبقى خاصاً، وتتبع كل خطوة مهمة.",
    guestEyebrow: "للضيوف",
    guestTitle: "يحتاج الضيوف معلومات موثوقة قبل السفر.",
    guestPoint1Title: "تفاصيل قائمة واضحة",
    guestPoint1Desc:
      "راجع نوع العقار والمدينة والحي والسعة والمرافق والقواعد والسعر ومستوى التحقق قبل المتابعة.",
    guestPoint2Title: "قواعد المنزل ظاهرة",
    guestPoint2Desc:
      "تُعرض القواعد المهمة قبل الحجز، بما فيها السعة والتدخين والحيوانات والزوار وشروط تسجيل الوصول.",
    guestPoint3Title: "عنوان دقيق محمي",
    guestPoint3Desc:
      "لا يُعرض العنوان الدقيق علناً. يُشارك فقط وفق حالة تأكيد الحجز الرسمية.",
    guestPoint4Title: "طلب حجز متتبع",
    guestPoint4Desc:
      "اعرف ما إذا كان طلبك مُرسلاً أو قيد المراجعة أو معتمداً بانتظار الدفع أو مؤكداً أو مرفوضاً أو ملغى أو مكتملاً.",
    guestReminder:
      "لا تعتبر الإقامة مؤكدة حتى تقول حالة الحجز الرسمية بوضوح «مؤكد».",
    hostEyebrow: "للمضيفين",
    hostTitle: "يحتاج المضيفون حماية قبل فتح عقاراتهم.",
    hostPoint1Title: "تحقق منظم للمضيف",
    hostPoint1Desc:
      "تُراجع طلبات المضيفين والتحقق من الهوية قبل نشر القوائم.",
    hostPoint2Title: "قوائم مُراقَبة",
    hostPoint2Desc:
      "تُراجع القوائم تدريجياً قبل النشر أو التحقق الكامل خلال مرحلة الإطلاق.",
    hostPoint3Title: "طلبات مؤهلة",
    hostPoint3Desc:
      "يفهم الضيوف القواعد والشروط قبل إرسال الطلب، مما يقلل سوء الفهم.",
    hostPoint4Title: "حماية المعلومات الخاصة",
    hostPoint4Desc:
      "يبقى العنوان الدقيق وجهة اتصال الاستقبال محميين حتى حالة التأكيد المطلوبة.",
    findStay: "البحث عن إقامة",
    becomeHost: "كن مضيفاً",
  },
  footer: {
    tagline: "منصة مغربية لإقامات موثقة — أمان وشفافية وراحة للضيوف والمضيفين.",
    terms: "إشعار قانوني وشروط",
    refund: "سياسات المنصة",
    aboutUs: "من نحن والتواصل",
    secured: "Nexa Stays حالياً في مرحلة إطلاق مُراقَبة في المغرب.",
    disclaimer:
      "Nexa Stays منصة رقمية مغربية لإقامات قصيرة موثقة. قد تتطور الميزات والرسوم والمدن وعمليات التحقق والتوفر خلال مرحلة الإطلاق. يخضع استخدام الخدمة لإشعارنا القانوني وسياسة الخصوصية وسياسات المنصة.",
    emailContact: "عام",
    emailSupport: "الدعم",
    emailPartnerships: "الشراكات",
  },
  listings: {
    staysTitle: "اعثر على إقامة في المغرب بثقة أكبر.",
    staysSubtitle:
      "استكشف إقامات قصيرة بمعلومات أوضح وقواعد ظاهرة ومضيفين موثقين حسب المستوى المطلوب وعملية طلب حجز أفضل تنظيماً.",
    noSurprises:
      "يُشارك العنوان الدقيق وتفاصيل الوصول الخاصة فقط عند تأكيد حجزك رسمياً.",
  },
  listingDetail: {
    requestToBook: "طلب الحجز",
    signInToBook: "سجّل الدخول للحجز",
  },
  about: {
    ourStory: "عن Nexa Stays",
    title: "منصة مغربية لإقامات موثقة من أجل سكن قصير المدة أكثر أماناً ووضوحاً.",
    subtitle:
      "أُنشئت Nexa Stays لجعل الإقامة قصيرة المدة أكثر أماناً ووضوحاً وراحة للضيوف والمضيفين. نبني بديلاً محلياً لسوق يحتاج مزيداً من الثقة وهيكلة أفضل ومعلومات أوضح قبل التأكيد.",
    theProblem: "المشكلة",
    approachTitle: "الأمان والشفافية والراحة للطرفين.",
    approachSubtitle:
      "المنصة مفيدة فقط إذا بنت الثقة للجميع. تُبنى Nexa Stays على ثلاثة مبادئ أساسية.",
    pillar1Title: "الأمان",
    pillar1Desc:
      "الأمان يعني تقليل المخاطر غير الضرورية قبل الحجز وأثناءه وبعده. تحمي Nexa Stays العناوين الدقيقة وتراجع القوائم وتنظم معلومات المضيف وتتتبع حالات الطلبات.",
    pillar2Title: "الشفافية",
    pillar2Desc:
      "الشفافية تعني ألا يعتمد الضيوف والمضيفون على الافتراضات. يجب أن تكون القواعد والسعة والأسعار وشروط الوصول ومستويات التحقق وحالات الحجز ظاهرة ومفهومة.",
    pillar3Title: "الراحة",
    pillar3Desc:
      "الراحة ليست فقط عن العقار. بل عن العملية أيضاً. يجب أن يشعر الضيوف بثقة أكبر قبل الوصول. ويجب أن يشعر المضيفون بحماية أكبر قبل قبول الطلب.",
    privacyByDesign: "الخصوصية بالتصميم",
    privacyTitle: "الخصوصية جزء من الأمان.",
    privacyBody:
      "نحمي الخصوصية بقاعدة صارمة: تُخفى بيانات الاتصال حتى يتم التحقق من الطرفين وتأكيد الحجز.",
    privacyRule1: "لا أرقام مباشرة قبل التأكيد",
    privacyRule2: "لا بريد لتجاوز المنصة",
    privacyRule3: "لا عنوان دقيق قبل التأكيد",
    privacyRule4: "تبقى المراسلة داخل Nexa حتى يصبح الحجز حقيقياً",
    guestFeeLabel: "رسوم الضيف — من الأقل في السوق",
    feeSplitNote: "نوزع الرسوم بعدالة. يدفع الضيوف أقل. يحتفظ الملاك بمزيد.",
    betterMatching: "توافق أفضل",
    matchingTitle: "أكثر من الحجز: توافق أفضل.",
    matchingBody:
      "الإقامة الجيدة أيضاً مسألة ملاءمة. تقدم Nexa Stays طبقة أكثر إنسانية ليجد الضيوف أماكن تناسبهم حقاً.",
    partnerCta: "تريد الشراكة معنا؟",
    partnerBody:
      "إذا كنت تدير عقارات أو فنادق أو محفظة وحدات، يمكننا إدماجك كشريك.",
    contactPartnerships: "تواصل للشراكات →",
    startHosting: "ابدأ الاستضافة",
  },
};

function pruneObsoleteKeys(obj, enObj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  if (!enObj || typeof enObj !== "object" || Array.isArray(enObj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!(k in enObj)) continue;
    const enVal = enObj[k];
    if (v && typeof v === "object" && !Array.isArray(v) && enVal && typeof enVal === "object") {
      out[k] = pruneObsoleteKeys(v, enVal);
    } else {
      out[k] = v;
    }
  }
  for (const [k, v] of Object.entries(enObj)) {
    if (!(k in out)) out[k] = v;
  }
  return out;
}

function fillMissingFromEn(target, en, path = "") {
  if (!en || typeof en !== "object" || Array.isArray(en)) return target;
  const out = target && typeof target === "object" ? { ...target } : {};
  for (const [k, v] of Object.entries(en)) {
    const key = path ? `${path}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = fillMissingFromEn(out[k], v, key);
    } else if (!(k in out) || out[k] === undefined || out[k] === "") {
      out[k] = v;
    }
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

for (const [locale, overlay] of [
  ["fr", frOverlay],
  ["ar", arOverlay],
]) {
  const file = path.join(localesDir, `${locale}.json`);
  let current = JSON.parse(fs.readFileSync(file, "utf8"));
  current = pruneObsoleteKeys(current, en);
  current = deepMerge(current, overlay);
  current = fillMissingFromEn(current, en);
  // Re-apply overlay to ensure translations win over English fallbacks
  current = deepMerge(current, overlay);
  fs.writeFileSync(file, JSON.stringify(current, null, 2) + "\n", "utf8");
  console.log(`Updated ${locale}.json`);
}
