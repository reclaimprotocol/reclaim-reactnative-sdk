Reclaim react-native SDK usage example 

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

## Step 3: Modifying your App/Adding your data into App.tsx

### Configure your Deep linking and add it in the code 
### Add your App Secret
### Add your App ID
### Add your provider ID
### Add contextMessage/contextAddress to the context
### Handle proof receving actions in onSuccessCallback/onFailureCallback functions
