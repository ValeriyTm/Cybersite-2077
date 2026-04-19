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
import styles from './ContactsPage.module.scss'

export const ContactsPage = () => {
    return (
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
                    <img src="/images/banners/contactsBanner.jpg" alt="Главный вход в салон" />
                </div>
            </div>
            <div className={styles.contancts}>
                <p>Наши контакты:
                </p>
                <div className={styles.contacts}>
                    <a href="tel:+79830000000">+7(000) 000 00-00</a>
                    <a href="mailto:info@cybersite2077.com">info@cybersite2077.com</a>
                </div>
                <div className={styles.soc1als}>
                    <FaFacebook className={styles.facebook} /> <FaTelegram className={styles.telegram} /> <FaWhatsapp className={styles.whatsapp} /> <FaViber className={styles.viber} />
                    <FaTwitter className={styles.twitter} /> <FaTiktok className={styles.tiktok} /> <FaVk className={styles.vk} /> <FaYoutube className={styles.youtube} />
                </div>
            </div>
        </div>
    )
}