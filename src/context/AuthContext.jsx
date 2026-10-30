import { AuthContext } from "./authContextInstance";
import { checkEmailAuthProvider } from "../auth/authService";
import { getPermissions } from "../auth/permissions";
import { useAccountActions } from "../auth/useAccountActions";
import { useOtp } from "../auth/useOtp";
import { usePasswordReset } from "../auth/usePasswordReset";
import { useSession } from "../auth/useSession";
import { useSignIn } from "../auth/useSignIn";

export { useAuth } from "./useAuth";

export function AuthProvider({ children }) {
  const session = useSession();
  const actions = {
    ...useSignIn(session),
    ...useOtp(session),
    ...usePasswordReset(session),
    ...useAccountActions(session),
  };
  const permissions = getPermissions(session.role);

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        role: session.role,
        loading: session.loading,
        error: session.error,
        ...actions,
        checkEmailAuthProvider,
        logout: actions.signOut,
        isAuthenticated: Boolean(session.user),
        ...permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
