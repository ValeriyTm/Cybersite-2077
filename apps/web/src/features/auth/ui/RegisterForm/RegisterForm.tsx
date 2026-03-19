import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { HiEye, HiEyeOff } from "react-icons/hi"; // Импорт иконок
import { RegisterFormSchema, type RegisterFormInput } from "@repo/validation";
import styles from "../AuthCard/AuthCard.module.scss";
import { $api } from "@/shared/api/api";

// export const AuthForm = () => {
//   const [isLogin, setIsLogin] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<RegisterFormInput>({
//     resolver: zodResolver(RegisterFormSchema),
//     mode: "onBlur",
//   });

//   const onSubmit = async (data: RegisterFormInput) => {
//     try {
//       // Отправляем на бэк только данные без подтверждения пароля и чекбокса
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       const { confirmPassword, acceptTerms, ...apiData } = data;

//       const response = await axios.post(
//         "http://localhost:3001/api/auth/register",
//         apiData,
//       );
//       alert(response.data.message);
//     } catch (error: any) {
//       alert(error.response?.data?.message || "Ошибка регистрации");
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.toggleWrapper}>
//         <button
//           className={`${styles.toggleBtn} ${!isLogin ? styles.active : ""}`}
//           onClick={() => setIsLogin(false)}
//         >
//           Sign up
//         </button>
//         <button
//           className={`${styles.toggleBtn} ${isLogin ? styles.active : ""}`}
//           onClick={() => setIsLogin(true)}
//         >
//           Log in
//         </button>
//       </div>

//       <div className={styles.formCard}>
//         <h2>{isLogin ? "Log in" : "Sign up"}</h2>

//         <button className={styles.googleBtn} type="button">
//           {/* <img src="/google-icon.svg" alt="G" /> */}
//           <FcGoogle size={24} />
//           <span>{isLogin ? "Log in with Google" : "Sign up with Google"}</span>
//         </button>

//         <div className={styles.divider}>
//           <span>OR</span>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           {!isLogin && (
//             <div className={styles.field}>
//               <label>Name</label>
//               <input
//                 {...register("name")}
//                 placeholder="Your name"
//                 className={errors.name ? styles.inputError : ""}
//               />
//               {errors.name && (
//                 <span className={styles.errorText}>{errors.name.message}</span>
//               )}
//             </div>
//           )}

//           <div className={styles.field}>
//             <label>Email address</label>
//             <input
//               {...register("email")}
//               placeholder="mail@example.com"
//               className={errors.email ? styles.inputError : ""}
//             />
//             {errors.email && (
//               <span className={styles.errorText}>{errors.email.message}</span>
//             )}
//           </div>

//           <div className={styles.field}>
//             <label>Password</label>
//             <div className={styles.passwordWrapper}>
//               <input
//                 {...register("password")}
//                 type={showPassword ? "text" : "password"}
//                 placeholder="••••••••"
//                 className={errors.password ? styles.inputError : ""}
//               />
//               <button
//                 type="button"
//                 className={styles.eyeBtn}
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? <HiEyeOff /> : <HiEye />}
//               </button>
//             </div>
//             {errors.password && (
//               <span className={styles.errorText}>
//                 {errors.password.message}
//               </span>
//             )}
//           </div>

//           {!isLogin && (
//             <>
//               <div className={styles.field}>
//                 <label>Confirm Password</label>
//                 <input
//                   {...register("confirmPassword")}
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   className={errors.confirmPassword ? styles.inputError : ""}
//                 />
//                 {errors.confirmPassword && (
//                   <span className={styles.errorText}>
//                     {errors.confirmPassword.message}
//                   </span>
//                 )}
//               </div>

//               <div className={styles.checkboxField}>
//                 <input
//                   type="checkbox"
//                   id="terms"
//                   {...register("acceptTerms")}
//                 />
//                 <label htmlFor="terms">
//                   Я даю{" "}
//                   <a href="/consent" target="_blank">
//                     Согласие на обработку персональных данных
//                   </a>{" "}
//                   и принимаю условия{" "}
//                   <a href="/policy" target="_blank">
//                     Политики конфиденциальности
//                   </a>
//                 </label>
//                 {errors.acceptTerms && (
//                   <span className={styles.errorText}>
//                     {errors.acceptTerms.message}
//                   </span>
//                 )}
//               </div>
//             </>
//           )}

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className={styles.submitBtn}
//           >
//             {isSubmitting ? "Wait..." : isLogin ? "Log in" : "Sign up"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormSchema),
  });

  // Функция, которая сработает, если Zod найдет ошибки
  const onFormError = (errors: any) => {
    // Берем первую попавшуюся ошибку и выводим её в Toast
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message, {
        id: "form-validation-error", // Чтобы тосты не плодились, а заменяли друг друга
      });
    }
  };

  const onSubmit = async (data: RegisterFormInput) => {
    try {
      const res = await $api.post("/identity/auth/register", data);
      toast.success("Регистрация успешна! Проверьте почту.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Ошибка сервера");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className={styles.field}>
        <label>Name</label>
        <input
          {...register("name")}
          placeholder="Your name"
          className={errors.name ? styles.inputError : ""}
        />
        {errors.name && (
          <span className={styles.errorText}>{errors.name.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Email address</label>
        <input
          {...register("email")}
          placeholder="mail@example.com"
          className={errors.email ? styles.inputError : ""}
        />
        {errors.email && (
          <span className={styles.errorText}>{errors.email.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Password</label>
        <div className={styles.passwordWrapper}>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <HiEyeOff /> : <HiEye />}
          </button>
        </div>
        {errors.password && (
          <span className={styles.errorText}>{errors.password.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label>Confirm Password</label>
        <input
          {...register("confirmPassword")}
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <span className={styles.errorText}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <div className={styles.checkboxField}>
        <input type="checkbox" id="terms" {...register("acceptTerms")} />
        <label htmlFor="terms">
          Я даю{" "}
          <a href="/consent" target="_blank">
            Согласие на обработку персональных данных
          </a>{" "}
          и принимаю условия{" "}
          <a href="/policy" target="_blank">
            Политики конфиденциальности
          </a>
        </label>
        {errors.acceptTerms && (
          <span className={styles.errorText}>{errors.acceptTerms.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitBtn}
      >
        Sign up
      </button>
    </form>
  );
};
