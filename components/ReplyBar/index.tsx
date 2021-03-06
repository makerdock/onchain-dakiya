import React, { useRef } from "react";
import { toast } from "react-toastify";
import { listenEvents } from "../../utils/crypto";
import { threadReply } from "../../utils/queries";
import Button from "../Button";
import { Send } from "../Icons";

const ReplyBar = ({
	receiver,
	encryptionKey,
	threadId,
	senderPubEncKey,
	receiverPubEncKey,
	encrypted,
}: {
	receiver: string;
	encryptionKey: string;
	threadId: string;
	senderPubEncKey: string;
	receiverPubEncKey: string;
	encrypted: boolean;
}) => {
	const toastId = useRef(null);
	const [message, setMessage] = React.useState<string>("");
	const [loading, setLoading] = React.useState<boolean>(false);

	const handleSend = async () => {
		try {
			setLoading(true);
			await threadReply(
				receiver,
				message,
				threadId,
				encryptionKey,
				senderPubEncKey,
				receiverPubEncKey,
				encrypted
			);
			toastId.current = toast.loading("Sending message", {
				position: "bottom-left",
			});
			setMessage("");
			listenEvents().on("MessageSent", (...params) => {
				toast.update(toastId.current, {
					type: toast.TYPE.SUCCESS,
					render: "Email sent successfully",
					autoClose: 5000,
					isLoading: false,
					draggable: true,
				});
			});
		} catch (error) {
			console.error(error);
			toast.error(error.message ?? "Something went wrong");
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className=" sticky -bottom-4 -mb-4 py-4 shadow-sm flex items-start space-x-4 bg-secondaryBackground">
			<textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				rows={1}
				name="reply"
				id="reply"
				className="shadow-sm block w-full sm:text-sm border-transparent bg-messageHover rounded-md text-primaryText"
				placeholder="Reply to thread"
			/>
			<Button loading={loading} onClick={handleSend} icon={<Send />} />
		</div>
	);
};

export default ReplyBar;
