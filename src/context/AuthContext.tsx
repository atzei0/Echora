const loginWithGoogle = async (
  customFirstName?: string, 
  customLastName?: string, 
  googleEmail?: string
): Promise<boolean> => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    const fullName = fbUser.displayName || `${customFirstName || 'Utente'} ${customLastName || 'Google'}`.trim();
    const parts = fullName.split(' ');
    const first = customFirstName?.trim() || parts[0] || 'Utente';
    const last = customLastName?.trim() || parts.slice(1).join(' ') || '';

    const acc: UserAccount = {
      id: fbUser.uid,
      name: fullName,
      firstName: first,
      lastName: last,
      email: fbUser.email || googleEmail || '',
      provider: 'google',
      avatarUrl: fbUser.photoURL || undefined,
      vocalLevel: 'Allievo / Cantante',
      createdAt: new Date().toLocaleDateString('it-IT'),
      emailVerified: true,
      confirmationEmailSent: true,
      xp: 250,
      streakDays: 2,
    };

    await saveUserToFirestoreAndLocal(acc);
    setLastRegistrationNotification(
      `Autenticazione Google Firebase completata con successo per ${acc.name}! Account salvato.`
    );
    closeAuthModal();
    return true;

  } catch (err) {
    console.error('Google login error:', err);
    throw err;
  }
};
