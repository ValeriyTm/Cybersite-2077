//API:
import { API_URL } from "@/shared/api/api";
//SEO:
import { Helmet } from 'react-helmet-async';
//Стили:
import styles from "./Legal.module.scss";

export const TermsPage = () => {
  //SEO:
  const canonicalUrl = `${API_URL}/terms`;

  return (
    <>
      <Helmet>
        <title>Cybersite-2077 | Согласие на обработку персональных данных</title>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <div className={styles.container}>
        <h1>Согласие на обработку персональных данных</h1>
        <p>Последнее обновление: {new Date().toLocaleDateString()}</p>
        <section>
          <h4>
            <b>
              Примечание: Сайт является учебным проектом, реальные заказы не
              обрабатываются, и данные пользователя используются только для
              реализации функционала проекта.
            </b>
          </h4>
          <p>
            <ol>
              <li>
                <b>Цель</b>: Реализация функционала регистрации в личном кабинете и
                оформления заказов.
              </li>
              <li>
                <b>Действия</b>: Сбор, запись, хранение и удаление данных. Данные
                хранятся в БД проекта.
              </li>
              <li>
                <b>Срок</b>: До момента удаления аккаунта или по личному запросу
                черз сообщение в секции поддержки.
              </li>
              <li>
                <b>Отзыв</b>: Пользователь имеет право отозвать согласие в любой
                момент, отправив сообщение через секцию поддержки на сайте.
              </li>
            </ol>
          </p>

          <footer>
            <p>&copy; 2026 Cybersite-2077. Сделано в учебных целях.</p>
          </footer>
        </section>
        {/* Тут пара стандартных секций */}
      </div>
    </>
  )
};
