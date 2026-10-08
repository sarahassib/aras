import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

type Content = { title: string; body: string[] };

const SLUGS = ["delivery", "returns", "faq", "terms", "privacy", "about"] as const;
type Slug = (typeof SLUGS)[number];

const CONTENT: Record<Slug, Record<string, Content>> = {
  about: {
    fr: {
      title: "Qui sommes-nous",
      body: [
        "ARAS est une boutique marocaine qui réunit mode, électronique, maison et bien-être au même endroit.",
        "Nous sélectionnons des produits de qualité, à des prix justes, avec une livraison partout au Maroc et un paiement à la livraison.",
        "Notre équipe est basée à Casablanca et reste disponible 7 jours par semaine.",
      ],
    },
    en: {
      title: "Who we are",
      body: [
        "ARAS is a Moroccan store bringing fashion, electronics, home and wellness together in one place.",
        "We handpick quality products at fair prices, with delivery across Morocco and cash on delivery.",
        "Our team is based in Casablanca and available 7 days a week.",
      ],
    },
    ar: {
      title: "من نحن",
      body: [
        "أراس متجر مغربي يجمع الأزياء والإلكترونيات والمنزل والعافية في مكان واحد.",
        "نختار منتجات عالية الجودة بأسعار عادلة، مع توصيل إلى جميع أنحاء المغرب والدفع عند الاستلام.",
        "فريقنا مقره الدار البيضاء ومتوفر 7 أيام في الأسبوع.",
      ],
    },
  },
  delivery: {
    fr: {
      title: "Livraison",
      body: [
        "Livraison en 24–72 h à Casablanca et 2–5 jours ouvrés dans les autres villes du Maroc.",
        "Les frais de livraison dépendent de votre ville : 20 DH à Casablanca, jusqu'à 45 DH pour les autres villes.",
        "La livraison est gratuite dès 500 DH d'achat.",
        "Vous payez à la réception de votre commande, en espèces.",
      ],
    },
    en: {
      title: "Delivery",
      body: [
        "Delivery in 24–72 h to Casablanca and 2–5 business days to other cities in Morocco.",
        "Delivery fees depend on your city: 20 DH in Casablanca, up to 45 DH elsewhere.",
        "Delivery is free on orders of 500 DH and above.",
        "You pay in cash when your order arrives.",
      ],
    },
    ar: {
      title: "التوصيل",
      body: [
        "التوصيل خلال 24–72 ساعة إلى الدار البيضاء و2–5 أيام عمل إلى باقي مدن المغرب.",
        "تختلف رسوم التوصيل حسب مدينتك: 20 درهماً بالدار البيضاء وحتى 45 درهماً لباقي المدن.",
        "التوصيل مجاني ابتداءً من 500 درهم.",
        "تدفع نقداً عند استلام طلبك.",
      ],
    },
  },
  returns: {
    fr: {
      title: "Retours & échanges",
      body: [
        "Vous disposez de 14 jours après réception pour demander un échange ou un remboursement.",
        "Les articles doivent être retournés dans leur état d'origine, avec leurs étiquettes.",
        "Contactez-nous à contact@aras.ma avec votre numéro de commande.",
      ],
    },
    en: {
      title: "Returns & exchanges",
      body: [
        "You have 14 days after delivery to request an exchange or a refund.",
        "Items must be returned in their original condition, with tags attached.",
        "Contact us at contact@aras.ma with your order number.",
      ],
    },
    ar: {
      title: "الإرجاع والاستبدال",
      body: [
        "يحق لك طلب الاستبدال أو الاسترداد خلال 14 يوماً من التسليم.",
        "يجب إرجاع المنتجات بحالتها الأصلية مع بطاقاتها.",
        "تواصل معنا على contact@aras.ma مع رقم طلبك.",
      ],
    },
  },
  faq: {
    fr: {
      title: "FAQ",
      body: [
        "Comment payer ? — En espèces à la livraison (COD). Le paiement par carte arrive bientôt.",
        "Livrez-vous partout au Maroc ? — Oui, dans toutes les villes.",
        "Puis-je suivre ma commande ? — Oui, avec votre numéro de commande depuis la page Suivi.",
        "Comment annuler ? — Contactez-nous dès que possible avec votre numéro de commande.",
      ],
    },
    en: {
      title: "FAQ",
      body: [
        "How can I pay? — In cash on delivery (COD). Card payment is coming soon.",
        "Do you deliver everywhere in Morocco? — Yes, to every city.",
        "Can I track my order? — Yes, with your order number on the Track page.",
        "How do I cancel? — Contact us as soon as possible with your order number.",
      ],
    },
    ar: {
      title: "الأسئلة الشائعة",
      body: [
        "كيف أدفع؟ — نقداً عند الاستلام. الدفع بالبطاقة قريباً.",
        "هل التوصيل متاح لكل المدن المغربية؟ — نعم، إلى جميع المدن.",
        "هل يمكنني تتبع طلبي؟ — نعم، برقم الطلب من صفحة التتبع.",
        "كيف ألغي طلبي؟ — تواصل معنا في أقرب وقت مع رقم الطلب.",
      ],
    },
  },
  terms: {
    fr: {
      title: "Conditions générales",
      body: [
        "En passant commande sur ARAS, vous acceptez nos conditions générales d'utilisation.",
        "Les prix sont indiqués en dirhams (DH), toutes taxes comprises.",
        "ARAS se réserve le droit de refuser toute commande incomplète ou suspecte.",
        "La loi marocaine s'applique ; les tribunaux de Casablanca sont compétents.",
      ],
    },
    en: {
      title: "Terms & conditions",
      body: [
        "By placing an order on ARAS you accept these terms of use.",
        "Prices are shown in Moroccan dirhams (DH), taxes included.",
        "ARAS may refuse any incomplete or suspicious order.",
        "Moroccan law applies; the courts of Casablanca have jurisdiction.",
      ],
    },
    ar: {
      title: "الشروط العامة",
      body: [
        "بقيامك بالطلب من أراس فإنك تقبل شروط الاستخدام العامة.",
        "الأسعار معروضة بالدرهم المغربي، شاملة للضرائب.",
        "يحتفظ أراس بحق رفض أي طلب غير مكتمل أو مشبوه.",
        "يُطبَّق القانون المغربي وتختص محاكم الدار البيضاء.",
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      body: [
        "Nous collectons uniquement les données nécessaires : nom, téléphone, e-mail et adresse de livraison.",
        "Ces données servent à traiter et livrer vos commandes, et à vous contacter.",
        "Nous ne vendons jamais vos données à des tiers.",
        "Vous pouvez demander la suppression de vos données à contact@aras.ma.",
      ],
    },
    en: {
      title: "Privacy policy",
      body: [
        "We only collect what's needed: name, phone, email and delivery address.",
        "This data is used to process and deliver your orders, and to reach you.",
        "We never sell your data to third parties.",
        "You can request deletion of your data at contact@aras.ma.",
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      body: [
        "نجمع فقط ما هو ضروري: الاسم والهاتف والبريد الإلكتروني وعنوان التوصيل.",
        "تُستعمل هذه البيانات لمعالجة وتسليم طلباتك والتواصل معك.",
        "لا نبيع بياناتك لأي طرف ثالث.",
        "يمكنك طلب حذف بياناتك عبر contact@aras.ma.",
      ],
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = CONTENT[slug as Slug]?.fr;
  return { title: content?.title ?? "ARAS" };
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as Slug)) notFound();

  const content = CONTENT[slug as Slug][locale] ?? CONTENT[slug as Slug].fr;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="container-store section-spacing">
      <div className="mx-auto max-w-2xl">
        <h1 className="heading-display text-3xl md:text-4xl">{content.title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <a href="/" className="font-medium text-gold-600 hover:underline">
            ← {t("goHome")}
          </a>
        </p>
      </div>
    </div>
  );
}
