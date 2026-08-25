import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../app/features/authSlice.js";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutUser = () => {
    navigate("/");
    dispatch(logout());
    toast.success("Logged out successfully!", { duration: 3000 });
  };

  return (
    <div className="shadow bg-white">
      <nav className="flex items-center justify-between max-w-7xl mx-auto px-4 py-3.5 text-slate-800 transition-all">
        <Link to="/">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="CuratoCV logo" className="h-12 w-auto" />
            <img src="/brand.svg"alt="CuratoCV wordmark" className="h-10 w-auto"/>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <p className="max-sm:hidden">Hi, {user?.name}</p>
          <button
            onClick={logoutUser}
            className="bg-white hover:bg-slate-50 border border-gray-300 px-7 py-1.5 rounded-full active:scale-95 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
