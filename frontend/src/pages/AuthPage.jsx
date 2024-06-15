import authScreenAtom from "../atoms/authAtom"
import LoginCard from "../components/LoginCard"
import SignupCard from "../components/SignupCard"
import { useRecoilValue } from "recoil"

const AuthPage = () => {
    const authScreenState = useRecoilValue(authScreenAtom);
    console.log(authScreenState);
    return(
        <>
       {authScreenState === "login" ?<LoginCard/> :<SignupCard/>} 
        </>
    )
}
export default AuthPage