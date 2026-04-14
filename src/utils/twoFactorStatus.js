/**
 * Whether 2FA is enabled for Reward Hub, from /user/profile and/or trade user (login / Redux).
 * Supports `twoFactorEnabled` (getUser / some profile APIs) and legacy `twoFactorAuth`.
 *
 * `tradeUserFromGetUser` — optional result of trade `GET /trade/getUser` (`data.user`).
 * Network profile and trade user can disagree; if either says enabled, treat as enabled.
 */
export function isRewardHubTwoFactorEnabled(profile, authUser, tradeUserFromGetUser) {
  const u = profile?.user ?? profile?.data?.user;
  const fromUser =
    u?.isTwoFactorEnabled ?? u?.twoFactorEnabled ?? u?.twoFactorAuth;
  const fromProfile =
    profile?.isTwoFactorEnabled ??
    profile?.twoFactorEnabled ??
    profile?.twoFactorAuth;
  const fromAuth =
    authUser?.isTwoFactorEnabled ??
    authUser?.twoFactorEnabled ??
    authUser?.twoFactorAuth;
  const fromTradeGetUser =
    tradeUserFromGetUser?.isTwoFactorEnabled ??
    tradeUserFromGetUser?.twoFactorEnabled ??
    tradeUserFromGetUser?.twoFactorAuth;

  return Boolean(
    fromUser ?? fromProfile ?? fromAuth ?? fromTradeGetUser
  );
}
