import { Helmet } from "react-helmet-async";
import { UserProfile } from "@/components/profile/UserProfile";

export default function ProfilePage() {
  return (
    <>
      <Helmet>
        <title>Profile | AppraisalHub</title>
        <meta name="description" content="Manage your account profile" />
      </Helmet>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Account Profile</h1>
        <UserProfile />
      </div>
    </>
  );
} 