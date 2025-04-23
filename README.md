# About the Code

## Target

BLANK

# How to use git

## connect github account with your computer

1. generate ssh-key on your computer, simply type ssh-genkey or ssh-keygen, depends on your os
2. make sure you generate on the correct system
3. install git if you don't have
4. get your public key. .ssh/id_rsa.pub or .ssh/ed23482394.pub (I forgot the number 4096 I guess)
5. copy your public key to github account, in settings, SSH and GPG keys

## PUSH and PULL

### PULL the file

which means download the files from github server (or somewhere else)

```bash
git pull origin master
```

origin represents the url you selected the remote repository

### PUSH the file

push your code to the server

```
git push origin master
```

the same

### set remote

```
git remote add origin git@github.com:<username>/<repository name>.git
```

<username> is who created the repo
<repository name> is the repo name

* without the braces

### COMMIT

1. usually commits every time you update the code
2. remain small for each commit and with objectives every time.

```
git commit -m "this is the commit message"
```

* write clearly in your commit message (though I prefer writing "update")

FOR example you want to update the whole system, try to tear down in to functions

then commit for each functions.

push to origin when you complete (or anytime you want to save or share to others)

### IF conflict

PULL remote and resolve the conflict
PUSH to origin

* remember to pull the code every time you start to develop the system