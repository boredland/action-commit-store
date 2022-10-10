# commit-store

github action that stores and retrieves data inside a git comment on a git commit.

## usage

### store a value

```yaml
- id: set
  uses: boredland/action-commit-store@master
  with:
    storage-commit-sha: 13ef52e3a407d9828741990d69dded5a2b65f563
    key: some
    value: content
```

### update a value

```yaml
- id: update
  uses: boredland/action-commit-store@master
  with:
    storage-commit-sha: 13ef52e3a407d9828741990d69dded5a2b65f563
    key: some
    value: different content
```

### retrieve a value

```yaml
- id: get
  uses: boredland/action-commit-store@master
  with:
    storage-commit-sha: 13ef52e3a407d9828741990d69dded5a2b65f563
    key: some
```

### store values encrypted

this encrypts the whole store using a symmetrical cipher (aes gcm).

you'll need to provide a 32 characters long secret (ex.: `openssl rand -hex 16`).

```yaml
- id: update
  uses: boredland/action-commit-store@master
  with:
    storage-commit-sha: 13ef52e3a407d9828741990d69dded5a2b65f563
    encryption-secret: ${{ secrets.ENCRYPTION_SECRET }}
    key: some
    value: content
```

## using the value

the action returns two values:

- `value` - the content you stored
- `updated` - 'true' or 'false' indicating if the step updated the value
- `encrypted` - 'true' or 'false' indicating if the step encrypted the store
