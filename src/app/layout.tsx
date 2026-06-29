import type { Metadata } from "next";
import Script from "next/script";
import { diagnostic } from "@/content/activation-diagnostic";
import { GA_ID, CLARITY_ID } from "@/lib/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: diagnostic.meta.title,
  description: diagnostic.meta.description,
  openGraph: {
    type: "website",
    siteName: "Sari Sari Design",
    title: diagnostic.meta.title,
    description: diagnostic.meta.description,
  },
  twitter: {
    card: "summary_large_image",
    title: diagnostic.meta.title,
    description: diagnostic.meta.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {CLARITY_ID && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
