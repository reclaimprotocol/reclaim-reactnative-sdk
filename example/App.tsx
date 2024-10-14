import {Reclaim} from '@reclaimprotocol/reactnative-sdk';
import React from 'react';
import {Button, Text, View} from 'react-native';

export default function App() {
  const [proofData, setProofData] = React.useState('No proof data submitted');
  async function startVerificationFlow() {
    console.log('startVerificationFlow---------------------');
    try {
      //@ts-ignore
      const reclaimClient = new Reclaim.ProofRequest(
        '0x5Ccd1f72E3347629943e6a4aA9C22803F1064Ebf',
      ); // your app ID.
      const APP_SECRET =
        '0x2ef3c18823e6e77ed0888a0b4045efc36f22a35f3ed10481d4b3acc2b21e0188'; // your app secret key.

      const providerIds = [
        '1bba104c-f7e3-4b58-8b42-f8c0346cdeab', // your provider ID.
      ];

      const appDeepLink = 'mychat://chat'; //TODO: replace with your app deep link
      reclaimClient.setAppCallbackUrl(appDeepLink);

      reclaimClient.addContext('users address', 'add a message');

      await reclaimClient.buildProofRequest(providerIds[0]!);
      // await reclaimClient.buildProofRequest(providerIds[0]!, true, 'V2Linking'); // Redirect User = True, Use V2Linking

      // reclaimClient.setParams({CLAIM_DATA: 'test'}); // optional
      // reclaimClient.setRedirectUrl('http://mywebsite.com/home'); // optional

      reclaimClient.setSignature(
        await reclaimClient.generateSignature(APP_SECRET),
      );
      console.log('signature');
      const {requestUrl, statusUrl} =
        await reclaimClient.createVerificationRequest();

      console.log('requestUrl', requestUrl);
      console.log('statusUrl', statusUrl);

      await reclaimClient.startSession({
        onSuccessCallback: proof => {
          console.log('Verification success', proof);
          setProofData(proof.claimData.context);
          // Your business logic here
        },
        onFailureCallback: error => {
          console.error('Verification failed', error);
          // Your business logic here to handle the error
        },
      });
    } catch (error) {
      console.log('startVerificationFlow---------------------error', error);
    }
  }
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color: 'red'}}>React Native Reclaim Demo </Text>

      <Button
        onPress={() => startVerificationFlow()}
        title="Press here to start Verification"
      />
      <Text style={{color: 'red'}}>{proofData}</Text>
    </View>
  );
}
