import { useEffect } from "react";

interface SEO {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
}

export function useSEO({ title, description, canonical, image }: SEO) {
  useEffect(() => {
    document.title = title.length > 60 ? title.slice(0, 57) + "..." : title;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (description) {
      setMeta("description", description.slice(0, 160));
      setMeta("og:description", description.slice(0, 160), "property");
    }
    setMeta("og:title", title, "property");
    setMeta("og:type", "website", "property");
    if (image) setMeta("og:image", image, "property");

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, canonical, image]);
}
