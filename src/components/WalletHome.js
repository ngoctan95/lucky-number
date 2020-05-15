import React from "react";
import {Tabs} from "antd";
import {Form, Button, List} from "antd";
import Arweave from "arweave/web";
import ReactCodesInput from "react-codes-input";
import "react-codes-input/lib/react-codes-input.min.css";

const arweave = Arweave.init({
    host: "arweave.net",
    protocol: "https",
    timeout: 20000,
    logging: false,
});

const {TabPane} = Tabs;
const layout = {
    labelCol: {span: 6},
    wrapperCol: {span: 16},
};
const tailLayout = {
    wrapperCol: {offset: 6, span: 16},
};

const WalletHome = ({state, change, transferCrypto, txList}) => {
    return (
        <div>
            <Tabs defaultActiveKey="1">
                <TabPane tab="Buy a Lucky Number" key="1">
                    <Form
                        name="basic"
                        {...layout}
                        style={{marginTop: "20px"}}
                        initialValues={{remember: true}}
                    >
                        <Form.Item
                            label="Your Number"
                            name="number"
                            rules={[
                                {required: true, message: "Please input your lucky number!"},
                            ]}
                        >
                            <ReactCodesInput
                                initialFocus={false}
                                id="activation"
                                codeLength={6}
                                type="number"
                                hide={false}
                                placeholder=""
                                value={state.number}
                                onChange={(res) => {
                                    change(res, "number");
                                }}
                                letterCase="upper"
                                customStyleComponent={{
                                    maxWidth: "300px",
                                    margin: "0 auto",
                                }}
                            />
                        </Form.Item>
                        <Form.Item {...tailLayout} style={{textAlign: "center"}}>
                            <Button
                                disabled={
                                    !state.number || state.existNumber || (state.number && state.number.length !== 6)
                                }
                                onClick={transferCrypto}
                                htmlType="submit"
                                loading={state.creatingTx}
                            >
                                Buy!
                            </Button>
                        </Form.Item>
                    </Form>
                </TabPane>
                <TabPane tab="History" key="2">
                    <List
                        itemLayout="horizontal"
                        dataSource={txList}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <p>
                                            You bought <span/> <strong>{item.number}</strong>{" "}
                                            <span/>{" "} with{" "}
                                            <strong>{arweave.ar.winstonToAr(item.quantity)}</strong>{" "}
                                            <span/> AR
                                        </p>

                                    }
                                    description={
                                        <p>
                                            {" "}
                                            TxID: <span/>
                                            <a href={`https://viewblock.io/arweave/tx/${item.id}`}>
                                                {item.id}
                                            </a>
                                        </p>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </TabPane>
                <TabPane
                    tab={`Your Balance: ${state.arwBalance}`}
                    disabled
                    key="3"
                />
            </Tabs>
        </div>
    );
};

export default WalletHome;
