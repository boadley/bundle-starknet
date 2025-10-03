import { useUser } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { IoHelpCircleOutline, IoNotificationsOutline } from 'react-icons/io5';

export default function Header() {
  const { user, isSignedIn } = useUser();

  return (
    <header className="bg-primary p-4 flex justify-between items-center">
      {isSignedIn && user ? (
        <>
          {/* Left side - Profile and greeting */}
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-primary border border-disabled",
                  userButtonPopoverText: "text-white"
                }
              }}
            />
            <div>
              <p className="text-sm text-secondary">Hi,</p>
              <p className="text-white font-medium">
                {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
              </p>
            </div>
          </div>

          {/* Right side - Help and notifications */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-secondary hover:text-white transition-colors">
              <IoHelpCircleOutline className="w-5 h-5" />
              <span className="text-sm font-medium">HELP</span>
            </button>
            <button className="text-secondary hover:text-white transition-colors">
              <IoNotificationsOutline className="w-6 h-6" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-accent">Bundle</div>
        </>
      )}
    </header>
  );
}
