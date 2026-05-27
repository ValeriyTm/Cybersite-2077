//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { ContactsMap } from '@/widgets/ContactsMap'
import { SocialsList } from "@/shared/ui";
//Изображения:
import contactsBanner from '@/shared/assets/images/banners/contactsBanner.jpg';
//Стили:
import styles from './ContactsPage.module.scss'

export const ContactsPage = () => {
  //SEO:
  const canonicalUrl = `${import.meta.env.VITE_SITE_URL}/contacts`;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Контакты</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.info}>
          <h1>Контакты</h1>
          <p>Наш главный мотосалон вы можете найти по адресу: г.Красноярск, ул.Кибернетическая, д.2077:</p>

        </div>
        <div className={styles.map}>
          <ContactsMap />
        </div>
        <div className={styles.visual}>
          <p>Центральный вход со стороны парка:</p>
          <div className={styles.imgContainer}>
            <img src={contactsBanner} alt="Главный вход в салон" width='700' height='480' />
          </div>
        </div>
        <div className={styles.contancts}>
          <p>Наши контакты:
          </p>
          <div className={styles.contacts}>
            <a href="tel:+79830000000">+7(000) 000 00-00</a>
            <a href="mailto:info@cybersite2077.com">info@cybersite2077.com</a>
          </div>

          {/* Иконки соцсетей: */}
          <SocialsList />
        </div>
      </div>
    </>
  )
}