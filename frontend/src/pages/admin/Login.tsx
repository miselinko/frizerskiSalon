import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Scissors, LogIn } from "lucide-react";
import api from "../../api";
import { useAuthStore } from "../../store/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setToken, setAdmin } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/login", { email, password });
      return data;
    },
    onSuccess: async (data) => {
      setToken(data.access_token);
      const { data: me } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setAdmin(me);
      navigate("/admin/dashboard");
    },
    onError: () => {
      toast.error("Pogrešan email ili lozinka");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/10 border border-accent-500/20 mb-4">
            <Scissors size={28} className="text-accent-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1">Prijavite se za pristup</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@salon.rs"
              />
            </div>
            <div>
              <label className="label">Lozinka</label>
              <input
                type="password"
                className="input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn size={18} />
              {loginMutation.isPending ? "Prijava..." : "Prijavi se"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
