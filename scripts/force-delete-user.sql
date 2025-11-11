-- Force delete lorenzo.vanza@hotmail.com from EVERYWHERE

-- 1. Delete from user_profiles (if exists)
DELETE FROM user_profiles WHERE email = 'lorenzo.vanza@hotmail.com';

-- 2. Delete from pro_contractors (if exists)
DELETE FROM pro_contractors WHERE email = 'lorenzo.vanza@hotmail.com';

-- 3. Delete from auth.users
DELETE FROM auth.users WHERE email = 'lorenzo.vanza@hotmail.com';

-- Verify deletion
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles WHERE email = 'lorenzo.vanza@hotmail.com'
UNION ALL
SELECT 'pro_contractors', COUNT(*) FROM pro_contractors WHERE email = 'lorenzo.vanza@hotmail.com'
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users WHERE email = 'lorenzo.vanza@hotmail.com';
