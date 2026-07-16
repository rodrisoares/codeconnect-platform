import { BrowserRouter, Route, Routes } from "react-router"
import { Register } from "../pages/Register"
import { Login } from "../pages/Login"
import { Logout } from "../pages/Logout"
import { ProtectedRoute } from "../components/ProtectedRoute"
import { Feed } from "../pages/Feed"
import { BlogPost } from "../pages/BlogPost"
import { AuthLayout } from "../layouts/Auth"
import { AppLayout } from "../layouts/App"
import { NotFound } from "../pages/NotFound"
import { Profile } from "../pages/Profile"
import { EditProfile } from "../pages/EditProfile"
import { About } from "../pages/About"
import { CreatePost } from "../pages/CreatePost"
import { UserProfile } from "../pages/UserProfile"
import { Connections } from "../pages/Connections"
import { Saved } from "../pages/Saved"
import { People } from "../pages/People"
import { Welcome } from "../pages/Welcome"

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/auth' element={<AuthLayout />}>
                    <Route path='register' element={<Register />} />
                    <Route path='login' element={<Login />} />
                    <Route path='logout' element={<Logout />} />
                </Route>
                <Route path='/' element={<AppLayout />}>
                    <Route path='' element={
                        <ProtectedRoute>
                            <Feed />
                        </ProtectedRoute>
                    } />
                    <Route path='blog-post/:slug' element={
                        <ProtectedRoute>
                            <BlogPost />
                        </ProtectedRoute>
                    } />
                    <Route path='profile' element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path='profile/edit' element={
                        <ProtectedRoute>
                            <EditProfile />
                        </ProtectedRoute>
                    } />
                    <Route path='about' element={
                        <ProtectedRoute>
                            <About />
                        </ProtectedRoute>
                    } />
                    <Route path='post/new' element={
                        <ProtectedRoute>
                            <CreatePost />
                        </ProtectedRoute>
                    } />
                    <Route path='post/edit/:slug' element={
                        <ProtectedRoute>
                            <CreatePost />
                        </ProtectedRoute>
                    } />
                    <Route path='user/:id' element={
                        <ProtectedRoute>
                            <UserProfile />
                        </ProtectedRoute>
                    } />
                    <Route path='user/:id/connections' element={
                        <ProtectedRoute>
                            <Connections />
                        </ProtectedRoute>
                    } />
                    <Route path='saved' element={
                        <ProtectedRoute>
                            <Saved />
                        </ProtectedRoute>
                    } />
                    <Route path='people' element={
                        <ProtectedRoute>
                            <People />
                        </ProtectedRoute>
                    } />
                    <Route path='welcome' element={
                        <ProtectedRoute>
                            <Welcome />
                        </ProtectedRoute>
                    } />
                    <Route path='*' element={<NotFound />}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
} 