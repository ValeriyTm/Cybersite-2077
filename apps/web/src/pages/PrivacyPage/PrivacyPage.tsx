
//Состояние:
import { useEffect, useMemo, useState } from 'react';
import { usePrivacyStore } from '@/entities/session';
//Изображения:
import login from '@/shared/assets/images/login.png'
//Стили:
import styles from './PrivacyPage.module.scss';


export const PrivacyPage = () => {
  const { isAccepted, acceptPrivacy } = usePrivacyStore();

  const [secondsLeft, setSecondsLeft] = useState(10); //10 секунд кнопка принятия согласия будет заблокирована
  const [isChecked, setIsChecked] = useState(false);  //Состояние для чекбокса согласия

  useEffect(() => {
    if (secondsLeft <= 0) return;
    //Уменьшаем счетчик каждую секунду:
    const timerId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft]);


  const handleDecline = () => {
    window.location.href = 'https://google.com'; //При отказе уводим с сайта
  };

  const isTimerRunning = secondsLeft > 0;
  const isButtonDisabled = isTimerRunning || !isChecked;

  const buttonText = useMemo(() => {
    if (isTimerRunning) {
      return `Ознакомление: ${secondsLeft} сек`;
    }
    if (!isChecked) {
      return 'Поставьте галочку';
    }
    return 'Я согласен';
  }, [isTimerRunning, secondsLeft, isChecked]);

  if (isAccepted) return null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h1 className={styles.title}>Дисклеймер</h1>

        <h2>Сайт является учебным (пет) проектом и не осуществляет торговой или какой-либо иной деятельности. Услуги не предоставляются.</h2>
        <h3>Пожалуйста, не вводите свои реальные персональные, конфиденциальные и платежные данные, а также пароли, которые вы используете на других сайтах. </h3>

        <p className={styles.text}>
          Сайт создан в демонстрационных целях и не является публичной офертой.
        </p>
        <p className={styles.text}>
          Весь функционал, реализованный на сайте, является фиктивным и отражает лишь внешние признаки того, как это устроено в настоящих онлайн-магазинах. Заказы, оформленные на Сайте, носят ознакомительный характер. Фактическая отгрузка товаров и прием реальных денежных средств не производятся. На сайте подключен тестовый платежный шлюз, поэтому используйте только специальный тестовый номер карты (перед оплатой в модальном окне вы получите этот номер). <strong>Не вводите данные реальных банковских карт.</strong> При выборе адреса доставки при оформлении заказа не указывайте свой реальный адрес.</p>

        <p className={styles.text}>Ссылка на репозиторий с исходным кодом: <a href='https://github.com/ValeriyTm/Cybersite-2077'>Cybersite-2077</a></p>
        <p className={styles.text}>Связаться со мной Вы можете через аккаунт на GitHub: <a href='https://github.com/ValeriyTm'>ValeriyTm</a></p>

        <p className={styles.text}>
          Администрация Сайта не несет ответственности за любые убытки, возникшие из-за использования данного учебного ресурса. Сайт предоставляется по принципу «как есть» (as is). Автор не гарантирует бесперебойную работу или сохранность данных.
        </p>

        <div>
          <p className={styles.text}>
            Для полной оценки функционала, предоставляемого сайтом, пользователь должен иметь зарегистрированный аккаунт. У вас есть 2 варианта, как его получить:
          </p>
          <ol>
            <li>
              Использовать существующий общедоступный тестовый аккаунт (смотри ниже).
            </li>
            <li>
              Если вы хотите индивидуальный аккаунт, то можете связаться со мной и я создам его для вас, а затем передам реквизиты.
            </li>
          </ol>
          <p className={styles.text}>Прямая регистрация с вашим email, а также часть функционала на сайте ограничена во избежание нарушения 152 ФЗ.</p>
        </div>

        <p className={styles.text}>
          Все вводимые пользователем данные используются исключительно для технической реализации функционала сайта и не передаются куда-либо ещё. Вводя свои данные, вы соглашаетесь с тем, что они сохраняются в тестовой базе данных проекта, расположенной на территории РФ(и нигде больше).
          Отозвать свои данные, если вы их где-то ввели, можно либо через запрос при помощи формы обратной связи в секции поддержки, либо по личному запросу.
        </p>

        <p className={styles.text}>Доступный для тестирования аккаунт:</p>
        <img src={login} alt="" />
        <p className={styles.text}>Просим прощения за неудобство - данные представлены в виде изображения для защиты от спам-ботов</p>

        <p className={styles.text}>Нажимая кнопку согласия, вы подтверждаете, что согласны со всеми условиями, описанными выше, в т.ч. с тем, что нигде не будете вводить персональные и конфиденциальные данные на этом сайте.</p>

        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxText}>
            Я подтверждаю, что ознакомлен с условиями сбора данных
          </span>
        </label>

        <div className={styles.buttonGroup}>
          <button type='button' onClick={acceptPrivacy} disabled={isButtonDisabled} className={`${styles.btn} ${styles.btnAccept}`}>{buttonText}</button>
          <button type='button' onClick={handleDecline} className={`${styles.btn} ${styles.btnDecline}`}>Не согласен (Выйти)</button>
        </div>

        <p className={styles.footer}>2026 Cybersite-2077. Сделано в учебных целях.</p>
      </div>
    </div>
  );
};