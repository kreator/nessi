var sigCont = [];
var pubKey = [];
var sig = [];
var treejson;
var tree;

const TEST_CERT = "HUMAN:MALE:NICE";

genSig = i => {
  return SignatureController.generateKeys()
    .then(keys =>
      SignatureController.importKeys(keys[0], keys[1]).then(co => {
        sigCont[i] = co;
      })
    )
    .then(() => {
      sigCont[i]
        .exportPub()
        .then(pub => {
          return (pubKey[i] = pub);
        })
        .then(() => {
          if (i == 0) {
            sig[0] = "";
            return;
          }
          return hashData(TEST_CERT + pubKey[i]).then(hash =>
            sigCont[i - 1].sign(hash).then(sign => {
              sig[i] = sign;
            })
          );
        });
    });
};

var prom = genSig(0)
  .then(() => genSig(1))
  .then(() => genSig(2))
  .then(() => genSig(3));

var start = async () => {
  treejson = [0, 1, 2, 3].reduce((total, current) => {
    if (current == 3) {
      return total;
    }
    total[pubKey[current]] = [[pubKey[current + 1], sig[current + 1]]];
    return total;
  }, {});

  tree = new SigTree(sigCont[0], treejson, TEST_CERT);

  let testSig = await hashData(TEST_CERT + pubKey[0]).then(hash =>
    sigCont[3].sign(hash).then(sign => {
      sig[0] = sign;
    })
  );

  return tree.validateReceivedCertificate(pubKey[3], sig[0]);
};
