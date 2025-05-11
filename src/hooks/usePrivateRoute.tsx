// // src/hooks/usePrivateRoute.ts
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export const usePrivateRoute = () => {
//   const { isLoggedIn } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate("/", { replace: true });
//     }
//   }, [isLoggedIn, navigate]);

//   return { isLoggedIn };
// };
