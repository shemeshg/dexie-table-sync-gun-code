#!/usr/bin/env sh

# abort on errors
set -e

rm -rf dist

# build
npm run build

# navigate into the build output directory
cd dist

#cp ../404.html .
# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

echo "#  dexie-table-sync-gun  http://shemeshg.github.io/dexie-table-sync-gun" >> README.md

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

git remote add origin https://github.com/shemeshg/dexie-table-sync-gun.git 
git push -u origin master --force

git branch gh-pages
git push -u origin gh-pages --force


# website http://shemeshg.github.io/dexie-table-sync-gun

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -