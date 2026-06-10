import  { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../features/authSlice";
import { Coffee, Lock, Mail, User, Upload } from "lucide-react";
import api from "../api/axios"; // Imports your global axios configured instance

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Toggle between login mode or register mode
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    // Controlled form component tracking states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        image: null, // Stores raw string data for image conversions
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // File Picker to Base64 encoder method
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result }); // Encodes raw image to base64 string stream
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        try {
            if (isRegisterMode) {
                console.log("Processing hybrid registration parameters...");

                let regResponse;

                // Scenario A: User uploaded an image file asset element
                if (formData.image) {
                    console.log("Submitting multi-part form package...");
                    const multipartForm = new FormData();
                    multipartForm.append("full_name", formData.name);
                    multipartForm.append("email", formData.email);
                    multipartForm.append("password", formData.password);
                    multipartForm.append("role", "user");
                    multipartForm.append("image", formData.image); // Field key matches Multer instance fields

                    regResponse = await api.post("/users/register", multipartForm, {
                        headers: { "Content-Type": "multipart/form-data" },
                        validateStatus: (status) => status >= 200 && status < 600,
                    });
                }
                // Scenario B: User did not upload an image (Send clean JSON body layout)
                else {
                    console.log(
                        "No picture selected. Submitting standard fallback JSON object...",
                    );
                    regResponse = await api.post(
                        "/users/register",
                        {
                            full_name: formData.name,
                            email: formData.email,
                            password: formData.password,
                            role: "user",
                        },
                        {
                            headers: { "Content-Type": "application/json" },
                            validateStatus: (status) => status >= 200 && status < 600,
                        },
                    );
                }

                console.log(
                    "Server verification status context output:",
                    regResponse.status,
                    regResponse.data,
                );

                if (regResponse.status >= 200 && regResponse.status < 300) {
                    alert("Staff profile created successfully! You can now log in.");
                    setIsRegisterMode(false);
                } else {
                    // Graceful error processing rules block
                    const serverError =
                        regResponse.data?.error || regResponse.data?.message || "";
                    if (
                        serverError.toLowerCase().includes("duplicate") ||
                        regResponse.status === 409
                    ) {
                        setErrorMessage(
                            "This email address is already registered to a staff member.",
                        );
                    } else if (regResponse.status === 500) {
                        setErrorMessage(
                            "Backend layout conflict. Try registering without an image attachment first.",
                        );
                    } else {
                        setErrorMessage(
                            serverError ||
                            "Registration parameters invalid. Confirm size guidelines.",
                        );
                    }
                }
                setIsLoading(false);
                return;
            }

            // 2. Clean Login Flow mapped against your backend link
            console.log("Sending login handshake for:", formData.email);

            const response = await api.post(
                "/users/login",
                {
                    email: formData.email,
                    password: formData.password,
                },
                {
                    validateStatus: (status) => status >= 200 && status < 500,
                },
            );

            console.log("Direct Server Payload Received:", response.data);
            const data = response.data;

            // Check if data holds a declaration confirmation message or token keys
            if (data && (data.message === "Login successful" || data.token)) {
                const token = data.token;

                // Unpack properties safely matching your schema output wrappers
                const user = {
                    id: data.user?.user_id || 1,
                    full_name: data.user?.full_name || "Long Sarann",
                    email: data.user?.email || formData.email,
                    role: data.user?.role || "admin",
                    image_url: data.user?.image_url || null,
                };

                // Commit parameters safely into LocalStorage so interceptors capture it
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                // Dispatch variables directly to synchronize global Redux slice values
                dispatch(loginSuccess({ user, token }));

                console.log("Authenticated! Passage granted to POS terminal counters.");
                navigate("/orders");
            } else {
                setErrorMessage(
                    data?.message || "Invalid Email or Password Credentials.",
                );
            }
        } catch (error) {
            console.error("Network/System Level Error Trace:", error);
            if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
                setErrorMessage(
                    "The database container on Render is warming up. Please wait 5 seconds and click authenticate again.",
                );
            } else {
                setErrorMessage(
                    "CORS Block or Network connection failure. Verify your endpoint routes.",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-white">
            <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-slate-700/70 p-8 shadow-2xl space-y-6">
                {/* Decorative Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3.5 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-2xl text-white shadow-xl shadow-amber-600/10 mb-2">
                        <Coffee size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                        {isRegisterMode ? "Enlist New Samurai" : "Terminal Gateway"}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                        {isRegisterMode
                            ? "Create store operator access parameters."
                            : "Provide operational credentials to open cash till counters."}
                    </p>
                </div>

                {errorMessage && (
                    <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-xl text-xs font-semibold text-center animate-pulse">
                        {errorMessage}
                    </div>
                )}

                {/* Input Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Interactive Profile Picture Uploader (Only visible in Register Mode) */}
                    {isRegisterMode && (
                        <div className="flex flex-col items-center space-y-2 pb-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Upload Profile Avatar
                            </label>
                            <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-900/40 hover:border-amber-500 group transition-all relative">
                                {formData.image ? (
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        className="w-full h-full object-cover animate-fadeIn"
                                    />
                                ) : (
                                    <div className="text-center text-slate-500 group-hover:text-amber-400 transition-colors flex flex-col items-center gap-1">
                                        <Upload size={16} />
                                        <span className="text-[10px] font-extrabold uppercase tracking-wide block">
                                            Browse
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {isRegisterMode && (
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Full Name
                            </label>
                            <div className="relative">
                                <User
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                size={16}
                            />
                            <input
                                type="email"
                                required
                                placeholder="barista@coffee.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Security Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                                size={16}
                            />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl tracking-wide uppercase transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] mt-2"
                    >
                        {isLoading
                            ? "Processing Connection..."
                            : isRegisterMode
                                ? "Enlist Profile"
                                : "Authenticate Terminal"}
                    </button>
                </form>

                {/* Toggle Mode Footer Anchor */}
                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegisterMode(!isRegisterMode);
                            setErrorMessage("");
                        }}
                        className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors underline underline-offset-4"
                    >
                        {isRegisterMode
                            ? "Already have a profile? Login here"
                            : "Need a new register operator? Create account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
