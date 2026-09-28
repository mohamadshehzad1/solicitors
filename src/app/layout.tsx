import type { Metadata } from "next";
import "./globals.css";
import { LEAD_TRACKING_BOOTSTRAP_SCRIPT } from "@/lib/leadTracking";

export const metadata: Metadata = {
  title: {
    default: "The Compensation People | Housing Disrepair Claims Solicitors UK",
    template: "%s | The Compensation People",
  },
  description:
    "Expert housing disrepair claims solicitors for UK council and housing association tenants. Damp, mould, structural damage, heating, pest & electrical claims. No Win, No Fee. Free assessment. Up to £10,000 compensation.",
  keywords: [
    "housing disrepair claims",
    "housing disrepair solicitors",
    "housing disrepair compensation",
    "damp mould compensation",
    "council disrepair claim",
    "housing association claim",
    "tenant rights housing repairs",
    "no win no fee housing claims",
    "mould damage compensation UK",
    "Homes Fitness for Human Habitation Act",
    "Awaab's Law",
    "Section 11 Landlord and Tenant Act 1985",
  ],
  authors: [{ name: "The Compensation People" }],
  openGraph: {
    title: "The Compensation People | Housing Disrepair Claims Solicitors",
    description:
      "Expert housing disrepair claims for UK tenants. No Win, No Fee. Free assessment. Claim up to £10,000 compensation for damp, mould, structural damage & more.",
    type: "website",
    locale: "en_GB",
    siteName: "The Compensation People",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Compensation People | Housing Disrepair Claims",
    description:
      "Expert housing disrepair claims for UK tenants. No Win, No Fee. Free assessment.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.thecompensationpeopleltd.co.uk",
  },
};

const legalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "The Compensation People",
  description:
    "Expert housing disrepair claims services for UK council and housing association tenants. No Win, No Fee.",
  url: "https://www.thecompensationpeopleltd.co.uk",
  telephone: "+443301233309",
  email: "info@thecompensationpeopleltd.co.uk",
  address: {
    "@type": "PostalAddress",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  serviceType: [
    "Housing Disrepair Claims",
    "Damp and Mould Compensation",
    "Structural Disrepair Claims",
    "Heating and Boiler Claims",
    "Pest Infestation Claims",
    "Water Leaks and Plumbing Claims",
    "Electrical Hazards Claims",
  ],
  priceRange: "No Win No Fee",
  openingHours: "Mo-Fr 09:00-18:00",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "500",
    bestRating: "5",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Housing Disrepair Claims",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Damp and Mould Claims",
          description: "Compensation claims for damp, mould, and condensation in rented property",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Heating and Boiler Claims",
          description: "Claims for broken heating systems, boilers, and no hot water",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Structural Disrepair Claims",
          description: "Claims for cracked walls, leaking roofs, subsidence, and structural defects",
        },
      },
    ],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Compensation People",
  url: "https://www.thecompensationpeopleltd.co.uk",
  logo: "https://www.thecompensationpeopleltd.co.uk/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+443301233309",
    contactType: "customer service",
    availableLanguage: "English",
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(legalServiceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Stores first-touch UTM / click parameters for the session so lead
            submissions can be attributed. Renders nothing. */}
        <script dangerouslySetInnerHTML={{ __html: LEAD_TRACKING_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="bg-slate-50 text-navy-900 antialiased">
        {children}
      </body>
    </html>
  );
}
