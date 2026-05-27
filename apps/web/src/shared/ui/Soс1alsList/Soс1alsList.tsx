//Иконки:
import {
  FaFacebook, FaTelegram, FaWhatsapp, FaViber,
  FaTwitter, FaTiktok, FaVk, FaYoutube
} from "react-icons/fa";
//Стили:
import styles from "./Soс1alsList.module.scss";


const SOCIAL_LINKS = [
  { id: "facebook", label: "Facebook", href: "/", icon: FaFacebook },
  { id: "twitter", label: "Twitter", href: "/", icon: FaTwitter },
  { id: "tiktok", label: "Tiktok", href: "/", icon: FaTiktok },
  { id: "vk", label: "Vkontakte", href: "/", icon: FaVk },
  { id: "youtube", label: "Youtube", href: "/", icon: FaYoutube },
  { id: "telegram", label: "Telegram", href: "/", icon: FaTelegram },
  { id: "whatsapp", label: "Whatsapp", href: "/", icon: FaWhatsapp },
  { id: "viber", label: "Viber", href: "/", icon: FaViber },
];

export const SocialsList = () => {
  return (
    <div className={styles.soc1als}>
      <ul>
        {SOCIAL_LINKS.map(({ id, label, href, icon: Icon }) => (
          <li key={id}>
            <a
              href={href}
              aria-label={label}
              className={styles[id]}
              target="_blank"
              rel="noreferrer"
            >
              <Icon aria-hidden="true" focusable="false" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
