"use client";

import { useRouter } from "@/components/providers/loading-provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SIGN_IN_PATH } from "../utils";
import { ChevronUp, LogOut } from "lucide-react";

const DEFAULT_PLAN = "Free";

export type UserMenuUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type UserMenuTriggerVariant = "compact" | "profile";

type UserMenuProps = {
  user: UserMenuUser;
  /** `compact` — avatar-only trigger; `profile` — avatar + name in the trigger. */
  variant?: UserMenuTriggerVariant;
  plan?: string;
  className?: string;
};

export function getDisplayName(user: UserMenuUser) {
  return user.name?.trim() || user.email?.split("@")[0] || "User";
}

export function getInitials(user: UserMenuUser) {
  const source = user.name?.trim() || user.email || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function UserAvatar({
  user,
  size = "default",
}: {
  user: UserMenuUser;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size}>
      {user.image ? (
        <AvatarImage src={user.image} alt={getDisplayName(user)} />
      ) : null}
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>
  );
}

export function UserMenu({
  user,
  variant = "profile",
  plan = DEFAULT_PLAN,
  className,
}: UserMenuProps) {
  const router = useRouter();
  const displayName = getDisplayName(user);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(SIGN_IN_PATH);
          router.refresh();
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(className)}
        render={
          variant === "compact" ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full cursor-pointer"
              aria-label="Open account menu"
            />
          ) : (
            <Button
              variant="ghost"
              className="h-10 gap-2 px-3 cursor-pointer border border-border hover:bg-muted/50 rounded-lg"
              aria-label="Open account menu"
            />
          )
        }
      >
        <UserAvatar user={user} size={variant === "compact" ? "default" : "sm"} />
        {variant === "profile" ? (
          <>
            <span className="max-w-28 truncate text-left text-sm font-medium">
              {displayName}
            </span>
            <ChevronUp className="size-4 text-muted-foreground" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2 border border-border bg-popover shadow-md rounded-lg p-1">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-start gap-2 px-3 py-2.5">
              <UserAvatar user={user} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-sm font-semibold leading-none text-foreground">{displayName}</p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
                <Badge variant="secondary" className="w-fit text-[10px] py-0.5 px-2 font-medium">
                  {plan} plan
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type UserMenuWithSessionProps = Omit<UserMenuProps, "user">;

export function UserMenuWithSession(props: UserMenuWithSessionProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending || !session?.user) {
    return null;
  }

  return <UserMenu user={session.user} {...props} />;
}
