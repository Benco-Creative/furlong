// lib
// import { ThemeProvider } from "lib/theme-provider";
// import AppWrapper from "lib/wrappers/app-wrapper";
// import { UserAuthWrapper } from "lib/wrappers/user-auth-wrapper";
// components
// import { InstanceSidebar } from "./sidebar";
// import { InstanceHeader } from "./header";
import { DefaultLayout } from "@/layouts";
// styles
import "./globals.css";

export const metadata = {
  title: "God Mode",
  description: "You are god now.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout = async ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body className={`antialiased`}>
      <DefaultLayout>{children}</DefaultLayout>
      {/* <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
        <AppWrapper>
          <UserAuthWrapper>
            <div className="relative flex h-screen w-full overflow-hidden">
              <InstanceSidebar />
              <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
                <InstanceHeader />
                <div className="h-full w-full overflow-hidden px-10 py-6">
                  <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
                </div>
              </main>
            </div>
          </UserAuthWrapper>
        </AppWrapper>
      </ThemeProvider> */}
    </body>
  </html>
);

export default RootLayout;
