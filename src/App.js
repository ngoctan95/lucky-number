import React from "react";
import Arweave from "arweave/web";
import axios from "axios";
import { Decimal } from "decimal.js";
import {
  createTransaction,
  signAndDeployTransaction,
  getAddressAndBalance,
  openNotificationWithIcon,
  getTransactionIds,
  getTransaction,
  walletDefaut,
  price,
} from "./utils/arweaveUtils";
import LoadWallet from "./components/LoadWallet";
import ConfirmTxModal from "./components/ConfirmTxModal";
import WalletHome from "./components/WalletHome";
import { Layout, Spin, Card, Modal, Button, List, Avatar } from "antd";
import "./App.css";
import { UserOutlined } from "@ant-design/icons";

const { Header, Footer, Content } = Layout;

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  timeout: 20000,
  logging: false,
});

class App extends React.Component {
  state = {
    loading: false,
    loadWallet: false,
    walletData: "",
    number: "",
    creatingTx: false,
    arwAddress: "",
    arwBalance: "",
    arValue: price,
    arReceiverAddress: walletDefaut,
    txSendArray: [],
    transactionData: "",
    modalTx: false,

    loadingNumber: true,

    totalTransfer: 0,
    newBalance: 0,
    valueTab: 0,
    txFee: 0,
    dataLuckyNumber: [],
    existNumber: false,
    loadWalletData: "",
  };

  change = (e, name) => {
    if (name === "number") {
      if (this.state.dataLuckyNumber.some((item) => item.number === e)) {
        this.setState({ existNumber: true }, () => {
          openNotificationWithIcon(
            "error",
            "Error Message!",
            "Lucky Number Exist!"
          );
        });
      } else {
        this.setState({
          existNumber: false,
          [name]: e,
        });
      }
    }
  };

  handleCloseTxModal = () => this.setState({ modalTx: false });

  handleFileUpload = async (e, nameEvent) => {
    const rawWallet = await this.readWallet(e.target.files[0]);
    this.setState({ [nameEvent]: rawWallet });
  };

  readWallet = (walletFile) => {
    const readAsDataURL = (walletFile) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
          reader.abort();
          reject();
        };
        reader.addEventListener(
          "load",
          () => {
            resolve(reader.result);
          },
          false
        );
        reader.readAsText(walletFile);
      });
    };
    return readAsDataURL(walletFile);
  };

  async componentDidMount() {
    const numberData = await this.loadDataLuckyNumber();
    this.setState({ dataLuckyNumber: numberData, loadingNumber: false });
  }

  loadDataLuckyNumber = async () => {
    const { arReceiverAddress } = this.state;
    const txids = await getTransactionIds("to", arReceiverAddress);
    const jsonDatas = await Promise.all(
      await txids.map(async (txid) => {
        const res = await axios.get(`https://arweave.net/tx/${txid}/data`);
        let transactionData = await getTransaction(txid);
        transactionData.data = res.data;
        const data = transactionData.get("data", {
          decode: true,
          string: true,
        });
        return {
          number: data,
          avatar:
            "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        };
      })
    );
    return jsonDatas;
  };

  confirmLoadWallet = async () => {
    try {
      this.setState({ loading: true });
      const walletData = this.state.loadWalletData;
      let walletObj = JSON.parse(walletData);
      const { address, balance } = await getAddressAndBalance(walletObj);

      const txids = await getTransactionIds("from", address);
      const jsonDatas = await Promise.all(
        await txids.map(async (txid) => {
          const res = await axios.get(`https://arweave.net/tx/${txid}/data`);
          const transactionData = await getTransaction(txid);
          transactionData.data = res.data;
          const data = transactionData.get("data", {
            decode: true,
            string: true,
          });
          return { ...transactionData, number: data };
        })
      );
      this.setState({
        loading: false,
        loadWallet: true,
        walletData: walletObj,
        arwAddress: address,
        arwBalance: balance,
        loadWalletData: "",
        txSendArray: jsonDatas,
      });
    } catch (err) {
      this.setState({ loading: false });
      openNotificationWithIcon(
        "error",
        "Error Message!",
        "Something wrong, check your file key"
      );
    }
  };

  transferCrypto = async () => {
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      this.setState({ creatingTx: true });
      const {
        arValue,
        arwBalance,
        arReceiverAddress,
        walletData,
        number,
      } = this.state;
      if (arValue <= arwBalance) {
        let transaction = await createTransaction(
          arReceiverAddress,
          arValue,
          walletData,
          number
        );
        transaction.addTag("appname", `lucky-number-game-${month}-${year}`);
        let fee = arweave.ar.winstonToAr(transaction.reward);

        let result = await Decimal.add(fee, arValue).valueOf();
        let newBalance = await Decimal.sub(arwBalance, result).valueOf();
        if (newBalance < 0) {
          this.setState({ creatingTx: false }, () => {
            openNotificationWithIcon(
              "error",
              "Error Message!",
              "Insufficient founds, you much have 0.1 AR to buy."
            );
          });
          return;
        }
        this.setState({
          transactionData: transaction,
          modalTx: true,
          totalTransfer: result,
          txFee: fee,
          newBalance,
          creatingTx: false,
          cryptoTxPass: "",
        });
      } else {
        this.setState({ creatingTx: false }, () => {
          openNotificationWithIcon(
            "error",
            "Error Message!",
            "Insufficient founds, you much have 0.1 AR to buy."
          );
        });
      }
    } catch (err) {
      console.log(err);
      this.setState({ creatingTx: false }, () => {
        openNotificationWithIcon(
          "error",
          "Error Message!",
          "Something wrong, please try again!"
        );
      });
    }
  };

  confirmTransferCrypto = async () => {
    try {
      this.setState({ txRunning: true });
      let walletData = this.state.walletData;

      let txArray = this.state.txSendArray;
      let transaction = this.state.transactionData;

      const { arValue, arwBalance, arReceiverAddress } = this.state;
      const response = await signAndDeployTransaction(transaction, walletData);
      if (response.data === "OK" && response.status === 200) {
        const obj = {
          id: transaction.id,
          target: arReceiverAddress,
          quantity: arValue,
          reward: arweave.ar.winstonToAr(transaction.reward),
        };
        txArray.push(obj);
        const newBalance = Decimal.sub(arwBalance, arValue).valueOf();
        this.setState({
          cryptoTxPass: "",
          txSendArray: txArray,
          arValue: "",
          arReceiverAddress: "",
          txRunning: false,
          arwBalance: newBalance,
          modalTx: false,
        });
        walletData = "";
        openNotificationWithIcon(
          "success",
          "Success Message!",
          "Transaction Deploy Successfully"
        );
        return;
      }
      openNotificationWithIcon("error", "Error Message!", "Transaction Failed");
      walletData = "";
      this.setState({ txRunning: false, cryptoTxPass: "" });
    } catch (err) {
      openNotificationWithIcon("error", "Error Message!", "Transaction Failed");
      this.setState({ txRunning: false, cryptoTxPass: "" });
    }
  };

  walletDiv = () => {
    const { loadWallet, txSendArray, modalTx, txRunning } = this.state;
    if (!loadWallet) {
      return (
        <Card style={{ width: "100%" }}>
          <LoadWallet
            handleWalletUpload={this.handleFileUpload}
            confirmLoadWallet={this.confirmLoadWallet}
          />
        </Card>
      );
    } else {
      return (
        <div>
          <Card style={{ width: "100%" }} size="large">
            <WalletHome
              change={this.change}
              state={this.state}
              transferCrypto={this.transferCrypto}
              txList={txSendArray}
            />
          </Card>
          <Modal
            title="Confirm Transaction"
            onCancel={this.handleCloseTxModal}
            visible={modalTx}
            footer={[
              <Button key="back" onClick={this.handleCloseTxModal}>
                Return
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={txRunning}
                onClick={this.confirmTransferCrypto}
              >
                Submit
              </Button>,
            ]}
          >
            <ConfirmTxModal state={this.state} />
          </Modal>
        </div>
      );
    }
  };

  render() {
    const { loading, loadWallet, dataLuckyNumber, loadingNumber } = this.state;
    return (
      <Layout className="layout">
        <Header className="header"> Arweave Lucky Number Game</Header>
        <Content
          style={{
            margin: "auto",
            marginTop: "30px",
            overflow: "initial",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <Spin spinning={loading} delay={500} size="large" tip="Loading...">
            {this.walletDiv()}
          </Spin>
          {!loadWallet && (
            <Card
              style={{ width: "100%", marginTop: "40px" }}
              title="Lucky Number Was Bought In This Month"
            >
              <List
                style={{ width: "100%" }}
                loading={loadingNumber}
                pagination={{
                  pageSize: 3,
                }}
                dataSource={dataLuckyNumber}
                renderItem={(item) => (
                  <List.Item key={item.number}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <p>
                          Someone bought a lucky number:{" "}
                          <strong>{item.number}</strong>
                        </p>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
          <Card
            style={{ width: "100%", marginTop: "40px" }}
            title="Rule of Lucky Number Game"
          >
            <p>
              1. Choose your lucky number (6 character) and payment with{" "}
              <b>0.1 AR</b> (data will store in Arweave blockchain).
            </p>
            <p>
              2. Prizes will be given to the luckiest at the end of each month.
            </p>
            <p>
              3. How it work: There is a cron job to automatic randomize 3
              numbers that the user has purchased.
            </p>
            <p>
              {" "}
              &emsp; &emsp; - One <b>first prize</b> will be awarded{" "}
              <b>50% AR</b> of all tickets.
            </p>
            <p>
              {" "}
              &emsp; &emsp; - One <b>second prize</b> will be awarded{" "}
              <b>30% AR</b>.{" "}
            </p>
            <p>
              {" "}
              &emsp; &emsp; - One <b>third prize</b> will be awarded{" "}
              <b>10% AR</b>.{" "}
            </p>
          </Card>
        </Content>
        <Footer className="footer">
          Arweave Lucky Number ©2020 Created by Tan
        </Footer>
      </Layout>
    );
  }
}

export default App;
