# Reclaim reactnative-sdk

This README provides a step-by-step guide on integrating the Reclaim Protocol React native SDK into application

## Pre-requisites

- An application ID from Reclaim Protocol. You can get one from the [Reclaim Developer Protocol](https://dev.reclaimprotocol.org/)

## Create a new React application

```bash
npx react-native init ReclaimApp
cd ReclaimApp
```

## Install the Reclaim Protocol JS-SDK

```bash
npm install @reclaimprotocol/reactnative-sdk
```

## Import dependencies

In your `src/App.js` file, import the Reclaim SDK and the QR code generator

```javascript
import { useState, useEffect } from 'react'
import { Reclaim } from '@reclaimprotocol/reactnative-sdk'
```

## Initialize the Reclaim SDK

Declare your `application ID` and initialize the Reclaim Protocol client. Replace `YOUR_APPLICATION_ID_HERE` with the actual application ID provided by Reclaim Protocol.

File: `src/App.js`

```js copy
import { Reclaim } from '@reclaimprotocol/reactnative-sdk'
import { SafeAreaView, Text, View } from 'react-native'

function App() {
  const APP_ID = 'YOUR_APPLICATION_ID_HERE'
  const reclaimProofRequest = new Reclaim.ProofRequest(APP_ID)

  return (
    <SafeAreaView>
      <View>
        <Text>App</Text>
      </View>
    </SafeAreaView>
  )
}

export default App
```

### Add your app deep link

You'll need to add a deep link to your app. This will be used to redirect the user back to your app after they have completed the verification process.

- Guide to setup deep link on react-native can be found [here](https://reactnavigation.org/docs/deep-linking/).

```js copy showLineNumbers {11-12}
import { SafeAreaView, Text, View } from 'react-native'
import { ReclaimClient } from '@reclaimprotocol/reactnative-sdk'

function App() {
  const APP_ID = 'YOUR_APPLICATION_ID_HERE'
  const reclaimProofRequest = new Reclaim.ProofRequest(APP_ID)

  async function startVerificationFlow() {
    // id of the provider you want to generate the proof for
    await reclaimProofRequest.buildProofRequest('PROVIDER_ID')

    const appDeepLink = 'YOUR_APP_DEEP_LINK_HERE' //TODO: replace with your app deep link
    reclaimProofRequest.setAppCallbackUrl(appDeepLink)
  }

  return (
    <SafeAreaView>
      <View>
        <Text>App</Text>
      </View>
    </SafeAreaView>
  )
}

export default App
```

## Implement Verification Request Function

Create functions to handle the verification request. You'll need separate functions for prototype and production modes due to the different handling of the application secret and signature.

### Prototype Mode

For testing purposes, use the prototype mode. Note that in production, you should handle the application secret securely on your server.

File: `src/App.js`

```javascript
import { Reclaim } from '@reclaimprotocol/reactnative-sdk'
import { SafeAreaView, Text, View, Pressable } from 'react-native'

function App() {
  const APP_ID = 'YOUR_APPLICATION_ID_HERE'

  const reclaimProofRequest = new Reclaim.ProofRequest(APP_ID)

  async function startVerificationFlow() {
    // id of the provider you want to generate the proof for
    await reclaimProofRequest.buildProofRequest('PROVIDER_ID')

    const appDeepLink = 'YOUR_APP_DEEP_LINK_HERE' //TODO: replace with your app deep link
    reclaimProofRequest.setAppCallbackUrl(appDeepLink)

    reclaimProofRequest.setSignature(
      await reclaimProofRequest.generateSignature(
        'YOUR_APPLICATION_SECRET' // Handle securely for production
      )
    )

    const { requestUrl, statusUrl } =
      await reclaimProofRequest.createVerificationRequest()

    await reclaimProofRequest.startSession({
      onSuccessCallback: proof => {
        console.log('Verification success', proof)
        // Your business logic here
      },
      onFailureCallback: error => {
        console.error('Verification failed', error)
        // Your business logic here to handle the error
      },
    })
  }

  return (
    <SafeAreaView>
      <View>
        <Pressable onPress={startVerificationFlow}>
          <Text>Start Verification Flow</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

export default App
```

### Production Mode

In production mode, securely fetch and set the signature from your backend instead of using the application secret directly in the client.

Similar to the prototype mode but ensure to fetch and set the signature securely

```javascript
async function createVerificationRequestProductionMode() {
  // id of the provider you want to generate the proof for
  await reclaimProofRequest.buildProofRequest('PROVIDER_ID')

  const appDeepLink = 'YOUR_APP_DEEP_LINK_HERE' //TODO: replace with your app deep link
  reclaimProofRequest.setAppCallbackUrl(appDeepLink)

  reclaim
    .setSignature
    // TODO: fetch signature from your backend
    // On the backend, generate signature using:
    // await Reclaim.getSignature(requestedProofs, APP_SECRET)
    ()

  const { requestUrl, statusUrl } =
    await reclaimProofRequest.createVerificationRequest()

  await reclaimProofRequest.startSession({
    onSuccessCallback: proof => {
      console.log('Verification success', proof)
      // Your business logic here
    },
    onFailureCallback: error => {
      console.error('Verification failed', error)
      // Your business logic here to handle the error
    },
  })
}
```

## Contributing to Our Project

We're excited that you're interested in contributing to our project! Before you get started, please take a moment to review the following guidelines.

## Code of Conduct

Please read and follow our [Code of Conduct](https://github.com/reclaimprotocol/.github/blob/main/Code-of-Conduct.md) to ensure a positive and inclusive environment for all contributors.

## Security

If you discover any security-related issues, please refer to our [Security Policy](https://github.com/reclaimprotocol/.github/blob/main/SECURITY.md) for information on how to responsibly disclose vulnerabilities.

## Contributor License Agreement

Before contributing to this project, please read and sign our [Contributor License Agreement (CLA)](https://github.com/reclaimprotocol/.github/blob/main/CLA.md).

## Indie Hackers

For Indie Hackers: [Check out our guidelines and potential grant opportunities](https://github.com/reclaimprotocol/.github/blob/main/Indie-Hackers.md)

## License

This project is licensed under a [custom license](https://github.com/reclaimprotocol/.github/blob/main/LICENSE). By contributing to this project, you agree that your contributions will be licensed under its terms.

Thank you for your contributions!
