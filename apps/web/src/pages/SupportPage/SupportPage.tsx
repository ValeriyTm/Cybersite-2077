//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from "react-helmet-async";
//Стили:
import styles from "./SupportPage.module.scss";
import { SupportForm } from "@/features/support/ui";

export const SupportPage = () => {
  //----------SEO:-------------//
  const canonicalUrl = `${API_URL}/support`;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Поддержка</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.supportWrapper}>
        <h1>Служба поддержки</h1>
        <SupportForm />
      </div>
    </>
  );
};
