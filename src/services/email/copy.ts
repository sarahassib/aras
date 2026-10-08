export type EmailLocale = "fr" | "ar" | "en";

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

interface OrderEmailCopy {
  subject: string;
  heading: string;
  body: string;
  cta: string;
}

const orderCopy: Record<EmailLocale, Record<string, OrderEmailCopy>> = {
  fr: {
    order_created: {
      subject: "Votre commande {orderNumber} a bien été reçue",
      heading: "Merci pour votre commande !",
      body: "Nous avons bien reçu votre commande {orderNumber}. Notre équipe va la traiter dans les plus brefs délais et vous recevrez un e-mail à chaque étape.",
      cta: "Voir ma commande",
    },
    order_confirmed: {
      subject: "Votre commande {orderNumber} est confirmée",
      heading: "Commande confirmée",
      body: "Bonne nouvelle : votre commande {orderNumber} est confirmée et va être préparée par notre équipe.",
      cta: "Voir ma commande",
    },
    order_preparing: {
      subject: "Votre commande {orderNumber} est en préparation",
      heading: "Préparation en cours",
      body: "Votre commande {orderNumber} est en cours de préparation. Elle sera expédiée très prochainement.",
      cta: "Voir ma commande",
    },
    order_shipped: {
      subject: "Votre commande {orderNumber} est expédiée",
      heading: "Commande expédiée",
      body: "Votre commande {orderNumber} est en route ! Elle sera livrée à l'adresse que vous avez indiquée.",
      cta: "Suivre ma commande",
    },
    order_delivered: {
      subject: "Votre commande {orderNumber} a été livrée",
      heading: "Commande livrée",
      body: "Votre commande {orderNumber} a été livrée. Merci d'avoir choisi ARAS, nous espérons vous revoir bientôt.",
      cta: "Voir ma commande",
    },
    order_cancelled: {
      subject: "Votre commande {orderNumber} a été annulée",
      heading: "Commande annulée",
      body: "Votre commande {orderNumber} a été annulée. Si vous avez des questions, notre service client est à votre écoute.",
      cta: "Nous contacter",
    },
  },
  ar: {
    order_created: {
      subject: "تم استلام طلبك {orderNumber}",
      heading: "شكرًا لطلبك!",
      body: "لقد استلمنا طلبك {orderNumber} بنجاح. سيقوم فريقنا بمعالجه في أقرب وقت، وستصلك رسائل في كل مرحلة.",
      cta: "عرض الطلب",
    },
    order_confirmed: {
      subject: "تم تأكيد طلبك {orderNumber}",
      heading: "تم تأكيد الطلب",
      body: "أخبار سارة: تم تأكيد طلبك {orderNumber} وسيقوم فريقنا بتجهيزه قريباً.",
      cta: "عرض الطلب",
    },
    order_preparing: {
      subject: "طلبك {orderNumber} قيد التجهيز",
      heading: "قيد التجهيز",
      body: "يتم تجهيز طلبك {orderNumber} حالياً وسيتم شحنه في أقرب وقت.",
      cta: "عرض الطلب",
    },
    order_shipped: {
      subject: "طلبك {orderNumber} في الطريق إليك",
      heading: "تم شحن الطلب",
      body: "طلبك {orderNumber} في الطريق إليك! سيتم التسليم على العنوان الذي أدخلته.",
      cta: "تتبع الطلب",
    },
    order_delivered: {
      subject: "تم تسليم طلبك {orderNumber}",
      heading: "تم التسليم",
      body: "تم تسليم طلبك {orderNumber}. شكرًا لاختيارك ARAS، نتمنى أن نراكم قريباً.",
      cta: "عرض الطلب",
    },
    order_cancelled: {
      subject: "تم إلغاء طلبك {orderNumber}",
      heading: "تم إلغاء الطلب",
      body: "تم إلغاء طلبك {orderNumber}. إذا كان لديك أي سؤال، فريق خدمة العملاء في خدمتك.",
      cta: "تواصل معنا",
    },
  },
  en: {
    order_created: {
      subject: "Your ARAS order {orderNumber} has been received",
      heading: "Thank you for your order!",
      body: "We have received your order {orderNumber}. Our team will process it shortly and you will get an e-mail at every step.",
      cta: "View my order",
    },
    order_confirmed: {
      subject: "Your ARAS order {orderNumber} has been confirmed",
      heading: "Order confirmed",
      body: "Good news: your order {orderNumber} is confirmed and will be prepared by our team.",
      cta: "View my order",
    },
    order_preparing: {
      subject: "Your ARAS order {orderNumber} is being prepared",
      heading: "Being prepared",
      body: "Your order {orderNumber} is being prepared and will be shipped very soon.",
      cta: "View my order",
    },
    order_shipped: {
      subject: "Your ARAS order {orderNumber} has shipped",
      heading: "Order shipped",
      body: "Your order {orderNumber} is on its way! It will be delivered to the address you provided.",
      cta: "Track my order",
    },
    order_delivered: {
      subject: "Your ARAS order {orderNumber} has been delivered",
      heading: "Order delivered",
      body: "Your order {orderNumber} has been delivered. Thank you for choosing ARAS — we hope to see you again soon.",
      cta: "View my order",
    },
    order_cancelled: {
      subject: "Your ARAS order {orderNumber} has been cancelled",
      heading: "Order cancelled",
      body: "Your order {orderNumber} has been cancelled. If you have any questions, our customer service is here to help.",
      cta: "Contact us",
    },
  },
};

const staticCopy: Record<
  EmailLocale,
  Record<"password_reset" | "welcome", { subject: string; heading: string; body: string; cta: string }>
> = {
  fr: {
    password_reset: {
      subject: "Réinitialisez votre mot de passe ARAS",
      heading: "Mot de passe oublié ?",
      body: "Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      cta: "Choisir un nouveau mot de passe",
    },
    welcome: {
      subject: "Bienvenue chez ARAS !",
      heading: "Bienvenue chez ARAS",
      body: "Votre compte a été créé avec succès. Découvrez nos nouveautés et profitez de la livraison offerte dès 500 DH d'achat.",
      cta: "Découvrir la boutique",
    },
  },
  ar: {
    password_reset: {
      subject: "إعادة تعيين كلمة المرور الخاصة بـ ARAS",
      heading: "نسيت كلمة المرور؟",
      body: "اضغط على الزر بالأسفل لاختيار كلمة مرور جديدة. تنتهي صلاحية الرابط بعد ساعة. إذا لم تكن أنت من طلب ذلك، تجاهل هذه الرسالة.",
      cta: "اختيار كلمة مرور جديدة",
    },
    welcome: {
      subject: "مرحبًا بك في ARAS!",
      heading: "مرحبًا بك في ARAS",
      body: "تم إنشاء حسابك بنجاح. اكتشف أحدث منتجاتنا واستفد من التوصيل المجاني ابتداءً من 500 درهم.",
      cta: "تسوق الآن",
    },
  },
  en: {
    password_reset: {
      subject: "Reset your ARAS password",
      heading: "Forgot your password?",
      body: "Click the button below to choose a new password. This link expires in 1 hour. If you didn't request this, you can ignore this e-mail.",
      cta: "Choose a new password",
    },
    welcome: {
      subject: "Welcome to ARAS!",
      heading: "Welcome to ARAS",
      body: "Your account has been created successfully. Discover our latest products and enjoy free delivery on orders of 500 DH and above.",
      cta: "Start shopping",
    },
  },
};

const footerCopy: Record<EmailLocale, { tagline: string; note: string }> = {
  fr: {
    tagline: "Everything You Need, One Place",
    note: "Livraison partout au Maroc · Paiement à la livraison",
  },
  ar: {
    tagline: "كل ما تحتاجه، في مكان واحد",
    note: "توصيل إلى جميع المدن المغربية · الدفع عند الاستلام",
  },
  en: {
    tagline: "Everything You Need, One Place",
    note: "Delivery across Morocco · Cash on delivery",
  },
};

export function getOrderEmailCopy(locale: string, template: string): OrderEmailCopy {
  const lang = (orderCopy[locale as EmailLocale] ? locale : "fr") as EmailLocale;
  return orderCopy[lang][template] ?? orderCopy.fr.order_created;
}

export function getStaticEmailCopy(
  locale: string,
  template: "password_reset" | "welcome",
) {
  const lang = (staticCopy[locale as EmailLocale] ? locale : "fr") as EmailLocale;
  return staticCopy[lang][template];
}

export function getFooterCopy(locale: string) {
  const lang = (footerCopy[locale as EmailLocale] ? locale : "fr") as EmailLocale;
  return footerCopy[lang];
}

export function toEmailLocale(locale: string | undefined | null): EmailLocale {
  return locale === "ar" || locale === "en" ? locale : "fr";
}
