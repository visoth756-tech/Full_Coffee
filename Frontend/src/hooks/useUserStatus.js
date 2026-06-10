import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/authSlice";
import api from "../api/axios";

const useUserStatus = (checkIntervalMs = 120000) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!token || !user?.user_id) return;
      try {
        const response = await api.get(`/users/${user.user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.is_active === false) {
          dispatch(logout());
          navigate("/login", {
            state: {
              message:
                "Your account has been deactivated. Please contact admin.",
            },
          });
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          dispatch(logout());
          navigate("/login", {
            state: { message: "Session expired or access revoked." },
          });
        }
      }
    };

    if (token && user) {
      checkStatus();
      intervalRef.current = setInterval(checkStatus, checkIntervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, user, dispatch, navigate, checkIntervalMs]);
};

export default useUserStatus;
