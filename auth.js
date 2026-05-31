// Auth helpers — signup, login, admin role check
async function getSessionUser(){
  const {data}=await sb.auth.getSession();
  return data.session?.user||null;
}
async function isAdmin(userId){
  if(!userId) return false;
  const {data}=await sb.from('user_roles').select('role').eq('user_id',userId).eq('role','admin').maybeSingle();
  return !!data;
}
async function requireAdmin(){
  const u=await getSessionUser();
  if(!u){window.location.href='/pages/login.html';return null}
  const ok=await isAdmin(u.id);
  if(!ok){alert('Access denied: admin only.');await sb.auth.signOut();window.location.href='/pages/login.html';return null}
  return u;
}
async function doSignIn(email,password){
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error) throw error;
  return data.user;
}
async function doSignUp(email,password,name){
  const {data,error}=await sb.auth.signUp({
    email,password,
    options:{ data:{full_name:name}, emailRedirectTo: window.location.origin+'/pages/login.html' }
  });
  if(error) throw error;
  return data.user;
}
// Backwards compat
async function doLogin(email,password){
  const u=await doSignIn(email,password);
  const ok=await isAdmin(u.id);
  if(!ok){await sb.auth.signOut();throw new Error('You are not an admin.');}
  return u;
}
async function doLogout(){await sb.auth.signOut();window.location.href='/pages/login.html';}
