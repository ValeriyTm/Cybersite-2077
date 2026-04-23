//API:
import { API_URL } from "@/shared/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Компоненты:
import { ContactsMap } from '@/widgets/ContactsMap'
import {
  FaFacebook,
  FaTelegram,
  FaWhatsapp,
  FaViber,
  FaTwitter,
  FaTiktok,
  FaVk,
  FaYoutube,
} from "react-icons/fa";
//Стили:
import styles from './ContactsPage.module.scss'

export const ContactsPage = () => {
  //SEO:
  const canonicalUrl = `${API_URL}/contacts`;

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
            <img src="src/shared/assets/images/banners/contactsBanner.jpg" alt="Главный вход в салон" width='700' height='480' />
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
          <div className={styles.soc1als}>
            <ul>
              <li>
                <a href="/" aria-label="Facebook" className={styles.facebook}>
                  <FaFacebook aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Twitter" className={styles.twitter}>
                  <FaTwitter aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Tiktok" className={styles.tiktok}>
                  <FaTiktok aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Vkontakte" className={styles.vk}>
                  <FaVk aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Youtube" className={styles.youtube}>
                  <FaYoutube aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Telegram" className={styles.telegram}>
                  <FaTelegram aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Whatsapp" className={styles.whatsapp}>
                  <FaWhatsapp aria-hidden="true" focusable="false" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Viber" className={styles.viber}>
                  <FaViber aria-hidden="true" focusable="false" />
                </a>
              </li>
            </ul>
          </div>


        </div>
      </div>
    </>
  )
}